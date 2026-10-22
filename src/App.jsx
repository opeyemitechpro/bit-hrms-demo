import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import LoginPortal from "./components/LoginPortal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import MilestoneAlerts from "./components/MilestoneAlerts";
import StaffPostingsTab from "./components/StaffPostingsTab";
import StaffDocumentsTab from "./components/StaffDocumentsTab";
import FirstLoginModal from "./components/FirstLoginModal";
import UserManagementModal from "./components/UserManagementModal";

const API_BASE = "/api/v1";

// RBAC Role Definitions
const ROLES = [
  { id: 1, code: "SUPER_ADMIN", name: "Super Administrator", email: "superadmin@bit.ogunstate.gov.ng", deptId: null },
  { id: 2, code: "HR_ADMIN", name: "HR Administrator", email: "hradmin@bit.ogunstate.gov.ng", deptId: null },
  { id: 3, code: "HR_OFFICER", name: "HR Officer", email: "hrofficer@bit.ogunstate.gov.ng", deptId: null },
  { id: 4, code: "DEPT_ADMIN", name: "Department Admin (Software)", email: "deptadmin@bit.ogunstate.gov.ng", deptId: 4 },
  { id: 5, code: "VIEWER", name: "Viewer / Management", email: "viewer@bit.ogunstate.gov.ng", deptId: null },
];

export default function App() {
  // Authentication & Security state
  const [authToken, setAuthToken] = useState(() => new URLSearchParams(window.location.search).has("reset_token") ? null : localStorage.getItem("bit_hrms_token") || null);
  const [currentUser, setCurrentUser] = useState(() => {
    if (new URLSearchParams(window.location.search).has("reset_token")) return null;
    try {
      const saved = localStorage.getItem("bit_hrms_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Set default auth header whenever token changes
  useEffect(() => {
    if (authToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [authToken]);

  // Intercept 401 unauthenticated responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogoutLocal("Session has expired. Please sign in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState("nominal_roll");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states
  const [staffList, setStaffList] = useState([]);
  const [lookups, setLookups] = useState(() => {
    try {
      const cached = sessionStorage.getItem("bit_hrms_lookups");
      return cached ? JSON.parse(cached) : { departments: [], units: [], designations: [], grade_levels: [], statuses: [] };
    } catch {
      return { departments: [], units: [], designations: [], grade_levels: [], statuses: [] };
    }
  });
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMeta, setAuditMeta] = useState({ current_page: 1, last_page: 1, total: 0, actions: [], modules: [] });
  const [auditFilters, setAuditFilters] = useState({ search: "", action: "", module: "", from: "", to: "" });
  const [debouncedAuditSearch, setDebouncedAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Filters & Responsive Search
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all"); // "all", "ogun_no", "name", "cadre", "station"
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [staffListCadreFilter, setStaffListCadreFilter] = useState("ALL"); // ALL, PROGRAM_ANALYST, DATA_PROCESSING, POSTED, ACTIVE

  // Debounce search input by 250ms to prevent server connection flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAuditSearch(auditFilters.search), 300);
    return () => clearTimeout(timer);
  }, [auditFilters.search]);

  // Modals
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [profileTab, setProfileTab] = useState("particulars"); // particulars, postings, documents
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [auditDetail, setAuditDetail] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const OGUN_LGAS = [
    "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ifo",
    "Ijebu East", "Ijebu North", "Ijebu North-East", "Ijebu Ode", "Ikenne",
    "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu",
    "Ogun Waterside", "Remo North", "Sagamu", "Yewa North", "Yewa South"
  ];

  // Form State
  const initialFormState = {
    staff_number: "",
    title: "Mr.",
    surname: "",
    first_name: "",
    middle_name: "",
    gender: "Male",
    date_of_birth: "",
    official_email: "",
    phone_number: "",
    file_number: "",
    ogun_employee_number: "",
    ippis_number: "",
    department_id: "",
    unit_id: "",
    designation_id: "",
    grade_level_id: "",
    step: 1,
    employment_status_id: 1,
    current_station: "BIT Headquarters, Ogun Tech Hub, Kobape Road, Kobape, Abeokuta",
    date_of_first_appointment: "",
    date_of_confirmation: "",
    date_of_present_appointment: "",
    lga_of_origin: "Abeokuta North",
    state_of_origin: "Ogun",
    qualification: "B.Sc",
    remarks: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Login handler
  const handleLogin = async (username, password) => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      if (res.data.success) {
        const token = res.data.data.token;
        const user = res.data.data.user;
        setAuthToken(token);
        setCurrentUser(user);
        localStorage.setItem("bit_hrms_token", token);
        localStorage.setItem("bit_hrms_user", JSON.stringify(user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setFeedback({ type: "success", message: `Welcome back, ${user.name} (${user.role?.name || "Official"}). Session authorized.` });
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setLoginError("Too many failed attempts. Security rate limit active. Please wait 60 seconds.");
      } else {
        setLoginError(err.response?.data?.message || "Invalid username/email or password.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      if (authToken) {
        await axios.post(`${API_BASE}/auth/logout`);
      }
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      handleLogoutLocal();
    }
  };

  const handleLogoutLocal = (msg = null) => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem("bit_hrms_token");
    localStorage.removeItem("bit_hrms_user");
    delete axios.defaults.headers.common["Authorization"];
    setStaffList([]);
    setStats(null);
    setAuditLogs([]);
    if (msg) setLoginError(msg);
  };

  // RBAC Permission Gates
  const permissions = useMemo(() => {
    if (!currentUser) return {};
    const role = currentUser.role?.code || currentUser.code;
    return {
      canAddStaff: ["SUPER_ADMIN", "HR_ADMIN", "HR_OFFICER"].includes(role),
      canEditStaff: ["SUPER_ADMIN", "HR_ADMIN", "HR_OFFICER", "DEPT_ADMIN"].includes(role),
      canArchiveStaff: ["SUPER_ADMIN", "HR_ADMIN"].includes(role),
      canImport: ["SUPER_ADMIN", "HR_ADMIN", "HR_OFFICER"].includes(role),
      canExport: true,
      canViewAudit: ["SUPER_ADMIN", "HR_ADMIN"].includes(role),
      canManageUsers: role === "SUPER_ADMIN",
      isDeptRestricted: role === "DEPT_ADMIN",
      deptId: currentUser.department_id || currentUser.deptId,
      roleCode: role,
    };
  }, [currentUser]);

  // Fetch Lookups with SessionStorage cache
  const fetchLookups = async () => {
    try {
      const res = await axios.get(`${API_BASE}/staff/lookups`);
      if (res.data.success) {
        setLookups(res.data.data);
        sessionStorage.setItem("bit_hrms_lookups", JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error("Failed to load lookups", err);
    }
  };

  // Fetch Staff from API (Debounced to protect single-threaded server)
  const fetchStaff = async (searchQuery = debouncedSearch) => {
    setLoading(true);
    try {
      const params = { search: searchQuery, per_page: 100 };
      if (permissions.isDeptRestricted && permissions.deptId) {
        params.department_id = permissions.deptId;
      } else if (selectedDept) {
        params.department_id = selectedDept;
      }
      if (selectedGrade) params.grade_level_id = selectedGrade;

      const res = await axios.get(`${API_BASE}/staff`, { params });
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error("Failed to load staff list", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard/statistics`);
      setStats(res.data.data || null);
    } catch (err) {
      console.error("Failed to load statistics", err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (page = auditPage) => {
    setAuditLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/audit-logs`, {
        params: { ...auditFilters, search: debouncedAuditSearch, page, per_page: 25 },
      });
      setAuditLogs(res.data.data || []);
      setAuditMeta(res.data.meta || { current_page: 1, last_page: 1, total: 0, actions: [], modules: [] });
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const updateAuditFilter = (key, value) => {
    setAuditFilters((filters) => ({ ...filters, [key]: value }));
    setAuditPage(1);
  };

  const downloadCsv = async (endpoint, filename, params = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/staff/${endpoint}`, {
        params,
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("CSV download failed", err);
      setFeedback({ type: "error", message: err.response?.status === 401 ? "Your session has expired. Please sign in again." : "CSV download failed. Please try again." });
    }
  };

  useEffect(() => {
    if (authToken && currentUser) {
      fetchLookups();
      fetchStats();
    }
  }, [authToken, currentUser]);

  useEffect(() => {
    if (authToken && currentUser) {
      fetchStaff(debouncedSearch);
    }
  }, [debouncedSearch, selectedDept, selectedGrade, currentUser, authToken]);

  useEffect(() => {
    if (activeTab === "audit" && permissions.canViewAudit && authToken) {
      fetchAuditLogs(auditPage);
    }
  }, [activeTab, permissions.canViewAudit, authToken, auditPage, auditFilters.action, auditFilters.module, auditFilters.from, auditFilters.to, debouncedAuditSearch]);

  // Instant Responsive Client-Side Search Filter (0ms latency as the user types)
  const displayNominalRoll = useMemo(() => {
    if (!search.trim()) return staffList;
    const term = search.toLowerCase().trim();
    return staffList.filter((s) => {
      const ogNo = (s.ogun_employee_number || "").toLowerCase();
      const staffNo = (s.staff_number || "").toLowerCase();
      const surname = (s.surname || "").toLowerCase();
      const firstName = (s.first_name || "").toLowerCase();
      const middleName = (s.middle_name || "").toLowerCase();
      const fullName = `${surname} ${firstName} ${middleName}`.toLowerCase();
      const desig = (s.designation?.name || "").toLowerCase();
      const cadre = (s.designation?.cadre_name || "").toLowerCase();
      const station = (s.current_station || "").toLowerCase();
      const dept = (s.department?.name || "").toLowerCase();
      const deptCode = (s.department?.code || "").toLowerCase();
      const fileNo = (s.file_number || "").toLowerCase();
      const qual = (s.qualification || "").toLowerCase();
      const lga = (s.lga_of_origin || "").toLowerCase();

      if (searchField === "ogun_no") {
        return ogNo.includes(term) || staffNo.includes(term);
      }
      if (searchField === "name") {
        return fullName.includes(term) || surname.includes(term) || firstName.includes(term);
      }
      if (searchField === "cadre") {
        return cadre.includes(term) || desig.includes(term);
      }
      if (searchField === "station") {
        return station.includes(term);
      }
      // "all" fields
      return (
        ogNo.includes(term) ||
        staffNo.includes(term) ||
        fullName.includes(term) ||
        cadre.includes(term) ||
        desig.includes(term) ||
        station.includes(term) ||
        dept.includes(term) ||
        deptCode.includes(term) ||
        fileNo.includes(term) ||
        qual.includes(term) ||
        lga.includes(term)
      );
    });
  }, [staffList, search, searchField]);

  // Filtered staff list for the comprehensive Staff List section (including posted/seconded staff)
  const filteredStaffRegistry = useMemo(() => {
    return displayNominalRoll.filter((s) => {
      const cadre = s.designation?.cadre_name || "";
      const desig = s.designation?.name || "";
      if (staffListCadreFilter === "POSTED") {
        return s.status?.code === "POSTED" || (s.current_station && s.current_station.includes("Posted"));
      }
      if (staffListCadreFilter === "ACTIVE") {
        return s.status?.code === "ACTIVE" && (!s.current_station || !s.current_station.includes("Posted"));
      }
      if (staffListCadreFilter === "PROGRAM_ANALYST") {
        return cadre.includes("Program") || desig.includes("Program") || desig.includes("Software");
      }
      if (staffListCadreFilter === "DATA_PROCESSING") {
        return cadre.includes("Data Processing") || desig.includes("Data Processing");
      }
      if (staffListCadreFilter === "ADMIN_OFFICER") {
        return cadre.includes("Administrative") || desig.includes("Admin");
      }
      if (staffListCadreFilter === "EXECUTIVE_GD") {
        return cadre.includes("Executive Officer (GD)") || desig.includes("(GD)");
      }
      if (staffListCadreFilter === "ACCOUNTANT") {
        return cadre.includes("Accountant") || desig.includes("Accountant");
      }
      if (staffListCadreFilter === "EXECUTIVE_AC") {
        return cadre.includes("Executive Officer (A/C)") || desig.includes("(Accounts)");
      }
      if (staffListCadreFilter === "CONFIDENTIAL_SEC") {
        return cadre.includes("Confidential") || desig.includes("Secretary");
      }
      if (staffListCadreFilter === "SPECIAL_APPOINTEES") {
        return cadre.includes("Special") || s.grade_level?.name === "CON";
      }
      return true;
    });
  }, [displayNominalRoll, staffListCadreFilter]);

  // Dynamic Units for selected Department
  const filteredUnits = useMemo(() => {
    if (!formData.department_id) return [];
    return lookups.units.filter((u) => String(u.department_id) === String(formData.department_id));
  }, [formData.department_id, lookups.units]);

  // Live Auto-Calculation for Expected Retirement Date: min(DOB + 60, DOFA + 35)
  const calculatedRetirement = useMemo(() => {
    if (!formData.date_of_birth || !formData.date_of_first_appointment) return null;
    const dob = new Date(formData.date_of_birth);
    const dofa = new Date(formData.date_of_first_appointment);

    if (isNaN(dob.getTime()) || isNaN(dofa.getTime())) return null;

    const retirementByAge = new Date(dob.getFullYear() + 60, dob.getMonth(), dob.getDate());
    const retirementByService = new Date(dofa.getFullYear() + 35, dofa.getMonth(), dofa.getDate());

    const isAgeEarlier = retirementByAge < retirementByService;
    const finalDate = isAgeEarlier ? retirementByAge : retirementByService;
    const reason = isAgeEarlier ? "Attaining 60 Years of Age" : "Completing 35 Years of Public Service";

    return {
      date: finalDate.toISOString().split("T")[0],
      reason,
      byAge: retirementByAge.toISOString().split("T")[0],
      byService: retirementByService.toISOString().split("T")[0],
    };
  }, [formData.date_of_birth, formData.date_of_first_appointment]);

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingStaffId(null);
    setFormErrors({});
    const defaultDept = permissions.isDeptRestricted ? currentUser.deptId : "";
    setFormData({
      ...initialFormState,
      department_id: defaultDept,
      staff_number: `BIT/EMP/00${staffList.length + 10}`,
    });
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (staff) => {
    setEditingStaffId(staff.id);
    setFormErrors({});
    setFormData({
      staff_number: staff.staff_number || "",
      title: staff.title || "Mr.",
      surname: staff.surname || "",
      first_name: staff.first_name || "",
      middle_name: staff.middle_name || "",
      gender: staff.gender || "Male",
      date_of_birth: staff.date_of_birth ? staff.date_of_birth.substring(0, 10) : "",
      official_email: staff.official_email || "",
      phone_number: staff.phone_number || "",
      file_number: staff.file_number || "",
      ogun_employee_number: staff.ogun_employee_number || "",
      ippis_number: staff.ippis_number || "",
      department_id: staff.department_id || "",
      unit_id: staff.unit_id || "",
      designation_id: staff.designation_id || "",
      grade_level_id: staff.grade_level_id || "",
      step: staff.step || 1,
      employment_status_id: staff.employment_status_id || 1,
      current_station: staff.current_station || "BIT Headquarters, Ogun Tech Hub, Kobape Road, Kobape, Abeokuta",
      date_of_first_appointment: staff.date_of_first_appointment ? staff.date_of_first_appointment.substring(0, 10) : "",
      date_of_confirmation: staff.date_of_confirmation ? staff.date_of_confirmation.substring(0, 10) : "",
      date_of_present_appointment: staff.date_of_present_appointment ? staff.date_of_present_appointment.substring(0, 10) : "",
      lga_of_origin: staff.lga_of_origin || "Abeokuta North",
      state_of_origin: staff.state_of_origin || "Ogun",
      qualification: staff.qualification || "B.Sc",
      remarks: staff.remarks || "",
    });
    setIsFormModalOpen(true);
  };

  // Handle Form Submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      if (editingStaffId) {
        await axios.put(`${API_BASE}/staff/${editingStaffId}`, formData);
        setFeedback({ type: "success", message: `Staff record ${formData.staff_number} updated successfully.` });
      } else {
        await axios.post(`${API_BASE}/staff`, formData);
        setFeedback({ type: "success", message: `New staff member ${formData.staff_number} registered successfully.` });
      }

      setIsFormModalOpen(false);
      fetchStaff();
      fetchStats();
      if (permissions.canViewAudit) fetchAuditLogs();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setFeedback({ type: "error", message: err.response?.data?.message || "Operation failed." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Archive Staff
  const handleArchiveStaff = async (staff) => {
    if (!window.confirm(`Are you sure you want to archive ${staff.surname}, ${staff.first_name} (${staff.staff_number})? This action soft-deletes the record and preserves history.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/staff/${staff.id}`);
      setFeedback({ type: "success", message: `Staff record ${staff.staff_number} has been archived.` });
      fetchStaff();
      fetchStats();
      if (permissions.canViewAudit) fetchAuditLogs();
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to archive staff record." });
    }
  };

  // Handle CSV Import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    const data = new FormData();
    data.append("file", importFile);

    try {
      const res = await axios.post(`${API_BASE}/staff/import`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data);
      if (res.data.imported_count > 0) {
        fetchStaff();
        fetchStats();
        if (permissions.canViewAudit) fetchAuditLogs();
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: err.response?.data?.message || "Import upload failed.",
        errors: [{ row: "System", errors: [err.response?.data?.message || "Failed to process file."] }],
      });
    } finally {
      setImporting(false);
    }
  };

  const navItems = [
    {
      key: "dashboard",
      label: "Executive Dashboard",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      key: "nominal_roll",
      label: "Staff Nominal Roll",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: "staff_list",
      label: "Bureau Staff Registry",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      key: "directory",
      label: "Staff Directory Cards",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
    },
    {
      key: "milestones",
      label: "Milestones & Exit Alerts",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  // If not authenticated, render LoginPortal
  if (!authToken || !currentUser) {
    return (
      <LoginPortal
        onLogin={handleLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        ></div>
      )}

      {/* Sidebar Navigation (Responsive Drawer on mobile, Fixed on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Official Brand Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/ogun_state_logo.png"
              alt="Ogun State Logo"
              className="h-10 w-10 object-contain rounded-full bg-white p-0.5 shadow-sm shrink-0 border border-slate-700/50"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase truncate">
                OGUN STATE GOVERNMENT
              </div>
              <div className="text-xs font-bold text-white leading-tight">
                Bureau of Information Technology
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">BIT-HRMS Enterprise V1.0</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Core HR Modules</div>

          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left font-medium ${
                activeTab === item.key ? "bg-emerald-700 text-white font-semibold shadow-xs" : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {permissions.canImport && (
            <button
              onClick={() => {
                setActiveTab("import");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left font-medium ${
                activeTab === "import" ? "bg-emerald-700 text-white font-semibold shadow-xs" : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Data Import (CSV)</span>
            </button>
          )}

          {permissions.canViewAudit && (
            <button
              onClick={() => {
                setActiveTab("audit");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left font-medium ${
                activeTab === "audit" ? "bg-emerald-700 text-white font-semibold shadow-xs" : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Immutable Audit Logs</span>
            </button>
          )}

          {permissions.canManageUsers && (
            <button
              onClick={() => {
                setIsUserModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left font-medium bg-purple-950/40 text-purple-200 border border-purple-800/60 hover:bg-purple-900/60 hover:text-white"
            >
              <svg className="w-4 h-4 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Manage System Users</span>
            </button>
          )}

          {/* Future Modules */}
          <div className="pt-5 border-t border-slate-800 mt-4">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Future Modules (V2)</div>
            {["Leave Management", "Recruitment & Onboarding", "Promotions", "APER Performance", "Payroll Integration"].map((mod) => (
              <div key={mod} className="flex justify-between items-center px-3 py-1.5 text-slate-500 text-[11px] cursor-not-allowed">
                <span className="truncate">{mod}</span>
                <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Soon</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Authenticated User Profile & Session Controls */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-600 shadow-xs">
              {currentUser?.name ? currentUser.name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("") : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-bold truncate text-[11px]">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              currentUser.role?.code === 'SUPER_ADMIN' ? 'bg-purple-900/80 text-purple-200 border border-purple-700' :
              currentUser.role?.code === 'HR_ADMIN' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700' :
              currentUser.role?.code === 'HR_OFFICER' ? 'bg-blue-900/80 text-blue-200 border border-blue-700' :
              currentUser.role?.code === 'DEPT_ADMIN' ? 'bg-amber-900/80 text-amber-200 border border-amber-700' :
              'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {currentUser.role?.name || "Official"}
            </span>

            {permissions.isDeptRestricted && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-950 text-amber-300 border border-amber-800">
                Dept 4: Software
              </span>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Update your password"
            >
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Security</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-1.5 px-2.5 bg-rose-900/30 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sign out of BIT-HRMS"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile / Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <img
                src="/images/ogun_state_logo.png"
                alt="Ogun State Emblem"
                className="h-10 w-10 object-contain hidden sm:block shrink-0 rounded-full bg-white p-0.5 shadow-xs border border-slate-200"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Ogun State Government
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Bureau of Information Technology
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentUser.email}
              </span>
            </div>

            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
              currentUser.role?.code === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
              currentUser.role?.code === 'HR_ADMIN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              currentUser.role?.code === 'HR_OFFICER' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              currentUser.role?.code === 'DEPT_ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              {currentUser.role?.name || "Official"}
            </span>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              title="Update Credentials"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3 rounded-md text-xs font-medium flex justify-between items-center transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-6 flex-1 space-y-6">

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    Welcome back, <span className="text-emerald-800 font-black">{currentUser.name}</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentUser.designation ? `${currentUser.designation} • ` : ""}Bureau of Information Technology HR Portal
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs inline-flex items-center gap-1.5 self-start sm:self-auto">
                  <span>📅</span>
                  <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* KPI Cards (Responsive Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Total Staff Employed</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{staffList.length}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Across all cadres (HQ & Posted to MDAs)</div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Bureau Departments</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{lookups.departments.length || 4}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{lookups.units.length} functional administrative units</div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs sm:col-span-2 lg:col-span-1">
                  <div className="text-xs text-slate-500 font-medium">Upcoming Retirements (Next 12M)</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.summary?.retirements_next_12m || 0}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Statutory: 60 Yrs Age / 35 Yrs Service</div>
                </div>
              </div>

              {/* Departmental Staff Breakdown */}
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Staff Distribution Across Departments</h3>
                <div className="space-y-3">
                  {lookups.departments.map((dept) => {
                    const count = staffList.filter((s) => s.department_id === dept.id).length;
                    const percent = staffList.length > 0 ? Math.round((count / staffList.length) * 100) : 0;
                    return (
                      <div key={dept.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{dept.name} ({dept.code})</span>
                          <span className="font-semibold text-slate-900">{count} staff ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOMINAL ROLL (ACTIVE IN BUREAU) */}
          {activeTab === "nominal_roll" && (
            <div className="space-y-4">
              {/* Official Civil Service Printable Header (Visible only in Print) */}
              <div className="hidden print:block mb-4 text-center border-b-2 border-slate-900 pb-3">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img
                    src="/images/ogun_state_logo.png"
                    alt="Ogun State Crest"
                    className="h-16 w-16 object-contain"
                  />
                  <div>
                    <h1 className="text-base font-black text-slate-950 uppercase tracking-wide">
                      OGUN STATE GOVERNMENT OF NIGERIA
                    </h1>
                    <h2 className="text-sm font-bold text-slate-900 uppercase">
                      BUREAU OF INFORMATION TECHNOLOGY
                    </h2>
                    <p className="text-[11px] text-slate-700 font-medium">
                      Ogun Tech Hub, Kobape Road, Kobape, Abeokuta, Ogun State
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900 text-white py-1 px-4 text-xs font-bold uppercase tracking-wider inline-block rounded">
                  OFFICIAL STAFF NOMINAL ROLL — AS AT 31ST JULY, 2026
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      Official Civil Service Document
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mt-1">
                    BUREAU OF INFORMATION TECHNOLOGY — NOMINAL ROLL AS AT 31ST JULY, 2026
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official statutory nominal roll of personnel serving under the Bureau of Information Technology, Ogun State Government.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {!permissions.isDeptRestricted && (
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="">All Departments</option>
                      {lookups.departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.code}</option>
                      ))}
                    </select>
                  )}

                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="">All Grade Levels</option>
                    {lookups.grade_levels.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                      title="Select field to search by"
                    >
                      <option value="all">🔍 All Fields</option>
                      <option value="ogun_no">🎫 OG No / Staff ID</option>
                      <option value="name">👤 Officer Name</option>
                      <option value="cadre">💼 Cadre / Designation</option>
                      <option value="station">📍 Posting Station</option>
                    </select>

                    <div className="relative flex-1 sm:w-44">
                      <input
                        type="text"
                        placeholder={
                          searchField === "ogun_no" ? "Search OG No or ID..." :
                          searchField === "name" ? "Search officer name..." :
                          searchField === "cadre" ? "Search cadre/post..." :
                          searchField === "station" ? "Search station/MDA..." :
                          "Search any field..."
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-2.5 pr-7 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-900 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Print or Save as Landscape PDF"
                  >
                    <span>🖨️</span>
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCsv("export", `BIT_Nominal_Roll_${new Date().toISOString().slice(0, 10)}.csv`, {
                      search,
                      department_id: selectedDept,
                      grade_level_id: selectedGrade,
                    })}
                    className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded hover:bg-emerald-900 transition-colors shadow-xs"
                  >
                    ⬇ Export CSV
                  </button>

                  {permissions.canImport && (
                    <button
                      type="button"
                      onClick={() => downloadCsv("template", "BIT_Nominal_Roll_Template.csv")}
                      className="px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1"
                      title="Download Official CSV Template for Staff Import"
                    >
                      <span>📥</span>
                      <span>CSV Template</span>
                    </button>
                  )}

                  {permissions.canAddStaff && (
                    <button
                      onClick={handleOpenCreateModal}
                      className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                    >
                      + Add Staff
                    </button>
                  )}
                </div>
              </div>

              {/* Official Nominal Roll Table (Responsive with Horizontal Scroll) */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1300px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Designation of Post</th>
                      <th className="py-2.5 px-2 text-center w-12">GL</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Name of the Present Holder (Surname in Caps)</th>
                      <th className="py-2.5 px-2 text-center min-w-[90px]">OG. No.</th>
                      <th className="py-2.5 px-2 text-center w-12">Sex</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of Birth</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of 1st Appt.</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of Conf.</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of Pres. Appt.</th>
                      <th className="py-2.5 px-2.5 min-w-[105px] text-amber-900">Exp. Retirement Date</th>
                      <th className="py-2.5 px-2.5 min-w-[110px]">LGA of Origin</th>
                      <th className="py-2.5 px-2.5 min-w-[100px]">Qualifications</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Current Station / Remarks</th>
                      <th className="py-2.5 px-2 text-center min-w-[100px] sticky right-0 bg-slate-100 no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan="15" className="py-8 text-center text-slate-400">Loading Official Nominal Roll records...</td>
                      </tr>
                    ) : displayNominalRoll.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="py-8 text-center text-slate-400">
                          No staff members found matching query criteria {search && `("${search}")`}.
                        </td>
                      </tr>
                    ) : (
                      displayNominalRoll.map((staff, index) => (
                        <tr key={staff.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-center text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {staff.designation?.name}
                            {staff.designation?.cadre_name && (
                              <div className="text-[10px] text-slate-400">{staff.designation.cadre_name}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 bg-slate-50/50">
                            {staff.grade_level?.name}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            <span className="font-bold text-slate-950 uppercase">{staff.surname}</span>, {staff.title ? `${staff.title} ` : ""}{staff.first_name} {staff.middle_name || ""}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                            {staff.ogun_employee_number || staff.staff_number}
                          </td>
                          <td className="py-2.5 px-2 text-center font-semibold text-slate-600">
                            {staff.gender === "Female" ? "F" : "M"}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600">{staff.date_of_birth}</td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600">{staff.date_of_first_appointment}</td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-500">{staff.date_of_confirmation || "—"}</td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600">{staff.date_of_present_appointment}</td>
                          <td className="py-2.5 px-2.5 font-mono font-bold text-amber-800 bg-amber-50/50">
                            {staff.expected_retirement_date}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-700">{staff.lga_of_origin || "—"}</td>
                          <td className="py-2.5 px-2.5 text-slate-700 font-medium">{staff.qualification || "—"}</td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {staff.current_station && staff.current_station.includes("Posted") ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                📍 {staff.current_station}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-700 font-medium">
                                {staff.current_station || staff.remarks || "BIT HQ, Ogun Tech Hub, Kobape"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center space-x-1.5 sticky right-0 bg-white shadow-xs no-print">
                            <button
                              onClick={() => {
                                setProfileTab("particulars");
                                setSelectedStaff(staff);
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px]"
                            >
                              Profile
                            </button>
                            {permissions.canEditStaff && (
                              <button
                                onClick={() => handleOpenEditModal(staff)}
                                className="text-blue-700 hover:text-blue-900 font-bold text-[11px]"
                              >
                                Edit
                              </button>
                            )}
                            {permissions.canArchiveStaff && (
                              <button
                                onClick={() => handleArchiveStaff(staff)}
                                className="text-rose-600 hover:text-rose-800 font-bold text-[11px]"
                              >
                                Del
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official 3-Tier Civil Service Signature & Endorsement Block */}
              <div className="hidden print:block mt-8 pt-4 border-t border-slate-400 page-break-inside-avoid">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                  Official Statutory Verification & Approval Endorsement Block
                </div>
                <div className="grid grid-cols-3 gap-6 text-xs text-slate-800">
                  <div className="border border-slate-400 p-3 rounded">
                    <div className="font-bold uppercase text-[11px] text-slate-900 mb-6">PREPARED BY:</div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-medium text-slate-600">HR Officer / Records Officer</div>
                    <div className="text-[10px] text-slate-500 mt-2">Sign & Date: ___________________</div>
                  </div>
                  <div className="border border-slate-400 p-3 rounded">
                    <div className="font-bold uppercase text-[11px] text-slate-900 mb-6">CHECKED & VERIFIED BY:</div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-medium text-slate-600">Director / Head of Admin & Supplies</div>
                    <div className="text-[10px] text-slate-500 mt-2">Sign & Date: ___________________</div>
                  </div>
                  <div className="border border-slate-400 p-3 rounded">
                    <div className="font-bold uppercase text-[11px] text-slate-900 mb-6">APPROVED BY:</div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-medium text-slate-600">Special Adviser / Permanent Secretary, BIT</div>
                    <div className="text-[10px] text-slate-500 mt-2">Official Seal & Stamp: ___________</div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 text-center mt-3">
                  Bureau of Information Technology Human Resource Management System (BIT-HRMS) • Certified Official Copy Generated on {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUREAU STAFF REGISTRY (ALL EMPLOYED: ACTIVE & POSTED TO OTHER AGENCIES) */}
          {activeTab === "staff_list" && (
            <div className="space-y-4">
              {/* Official Civil Service Printable Header (Visible only in Print) */}
              <div className="hidden print:block mb-4 text-center border-b-2 border-slate-900 pb-3">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img
                    src="/images/ogun_state_logo.png"
                    alt="Ogun State Crest"
                    className="h-16 w-16 object-contain"
                  />
                  <div>
                    <h1 className="text-base font-black text-slate-950 uppercase tracking-wide">
                      OGUN STATE GOVERNMENT OF NIGERIA
                    </h1>
                    <h2 className="text-sm font-bold text-slate-900 uppercase">
                      BUREAU OF INFORMATION TECHNOLOGY
                    </h2>
                    <p className="text-[11px] text-slate-700 font-medium">
                      Ogun Tech Hub, Kobape Road, Kobape, Abeokuta, Ogun State
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900 text-white py-1 px-4 text-xs font-bold uppercase tracking-wider inline-block rounded">
                  OFFICIAL BUREAU STAFF REGISTRY (ALL CADRES & DEPLOYMENTS)
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      Official Establishment Record
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mt-1">
                    STAFF LIST — BUREAU OF INFORMATION TECHNOLOGY
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official establishment cadre roster of all officers employed in the Bureau, including those deployed or posted to other MDAs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                      title="Select field to search by"
                    >
                      <option value="all">🔍 All Fields</option>
                      <option value="ogun_no">🎫 OG No / Staff ID</option>
                      <option value="name">👤 Officer Name</option>
                      <option value="cadre">💼 Cadre / Designation</option>
                      <option value="station">📍 Posting Station</option>
                    </select>

                    <div className="relative flex-1 sm:w-44">
                      <input
                        type="text"
                        placeholder={
                          searchField === "ogun_no" ? "Search OG No or ID..." :
                          searchField === "name" ? "Search officer name..." :
                          searchField === "cadre" ? "Search cadre/post..." :
                          searchField === "station" ? "Search station/MDA..." :
                          "Search any field..."
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-2.5 pr-7 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded border border-emerald-200">
                    Total: {filteredStaffRegistry.length}
                  </span>

                  {permissions.canImport && (
                    <button
                      type="button"
                      onClick={() => downloadCsv("template", "BIT_Nominal_Roll_Template.csv")}
                      className="px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1"
                      title="Download Official CSV Template for Staff Import"
                    >
                      <span>📥</span>
                      <span>CSV Template</span>
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-900 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Print or Save as Landscape PDF"
                  >
                    <span>🖨️</span>
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Quick Filter Cadre Pills Matching Official Cadres */}
              <div className="flex flex-wrap gap-1.5 text-xs no-print">
                {[
                  { key: "ALL", label: "All Bureau Officers" },
                  { key: "PROGRAM_ANALYST", label: "Program Analyst Cadre" },
                  { key: "DATA_PROCESSING", label: "Data Processing Cadre" },
                  { key: "ADMIN_OFFICER", label: "Admin Officer Cadre" },
                  { key: "EXECUTIVE_GD", label: "Executive Officer (GD)" },
                  { key: "ACCOUNTANT", label: "Accountant Cadre" },
                  { key: "EXECUTIVE_AC", label: "Executive Officer (A/C)" },
                  { key: "CONFIDENTIAL_SEC", label: "Confidential Secretary" },
                  { key: "SPECIAL_APPOINTEES", label: "Special Appointees" },
                  { key: "POSTED", label: "📍 Posted to MDAs" },
                  { key: "ACTIVE", label: "🏛 Active at BIT HQ" },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setStaffListCadreFilter(pill.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      staffListCadreFilter === pill.key
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Staff Registry Table - Matches media_1790776503680.jpg */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Surname (in Capital)</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Other Names</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Cadre / Designation</th>
                      <th className="py-2.5 px-2 text-center w-12">Sex</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of Birth</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of 1st Appt.</th>
                      <th className="py-2.5 px-2.5 min-w-[95px]">Date of Present Appt.</th>
                      <th className="py-2.5 px-2.5 text-center min-w-[90px]">OG Number</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Current Station / Remarks</th>
                      <th className="py-2.5 px-2 text-center min-w-[80px] sticky right-0 bg-slate-100 no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStaffRegistry.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="py-8 text-center text-slate-400">
                          No officers found matching the selected cadre or posting filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStaffRegistry.map((staff, index) => (
                        <tr key={staff.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-center text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900 uppercase">
                            {staff.surname}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {staff.title ? `${staff.title} ` : ""}{staff.first_name} {staff.middle_name || ""}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{staff.designation?.name}</div>
                            {staff.designation?.cadre_name && (
                              <div className="text-[10px] text-emerald-800 font-medium">{staff.designation.cadre_name}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-semibold text-slate-600">
                            {staff.gender === "Female" ? "F" : "M"}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600">{staff.date_of_birth}</td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600">{staff.date_of_first_appointment}</td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600">{staff.date_of_present_appointment}</td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold text-emerald-700">
                            {staff.ogun_employee_number || staff.staff_number}
                          </td>
                          <td className="py-2.5 px-3">
                            {staff.current_station && staff.current_station.includes("Posted") ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                📍 {staff.current_station}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-700 font-medium">
                                {staff.current_station || staff.remarks || "BIT HQ, Ogun Tech Hub, Kobape"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center sticky right-0 bg-white shadow-xs no-print">
                            <button
                              onClick={() => {
                                setProfileTab("particulars");
                                setSelectedStaff(staff);
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px]"
                            >
                              Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official 3-Tier Civil Service Signature & Endorsement Block */}
              <div className="hidden print:block mt-8 pt-4 border-t border-slate-400 page-break-inside-avoid">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                  Official Statutory Verification & Approval Endorsement Block
                </div>
                <div className="grid grid-cols-3 gap-6 text-xs text-slate-800">
                  <div className="border border-slate-400 p-3 rounded">
                    <div className="font-bold uppercase text-[11px] text-slate-900 mb-6">PREPARED BY:</div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-medium text-slate-600">HR Officer / Records Officer</div>
                    <div className="text-[10px] text-slate-500 mt-2">Sign & Date: ___________________</div>
                  </div>
                  <div className="border border-slate-400 p-3 rounded">
                    <div className="font-bold uppercase text-[11px] text-slate-900 mb-6">CHECKED & VERIFIED BY:</div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-medium text-slate-600">Director / Head of Admin & Supplies</div>
                    <div className="text-[10px] text-slate-500 mt-2">Sign & Date: ___________________</div>
                  </div>
                  <div className="border border-slate-400 p-3 rounded">
                    <div className="font-bold uppercase text-[11px] text-slate-900 mb-6">APPROVED BY:</div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-medium text-slate-600">Special Adviser / Permanent Secretary, BIT</div>
                    <div className="text-[10px] text-slate-500 mt-2">Official Seal & Stamp: ___________</div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 text-center mt-3">
                  Bureau of Information Technology Human Resource Management System (BIT-HRMS) • Certified Official Copy Generated on {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECTORY CARDS (RESPONSIVE GRID) */}
          {activeTab === "directory" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Staff Directory Cards</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Visual staff directory cards for quick identity and contact discovery.</p>
                </div>
                
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                    title="Select field to search by"
                  >
                    <option value="all">🔍 All Fields</option>
                    <option value="ogun_no">🎫 OG No / Staff ID</option>
                    <option value="name">👤 Officer Name</option>
                    <option value="cadre">💼 Cadre / Designation</option>
                    <option value="station">📍 Posting Station</option>
                  </select>

                  <div className="relative flex-1 sm:w-48">
                    <input
                      type="text"
                      placeholder={
                        searchField === "ogun_no" ? "Search OG No or ID..." :
                        searchField === "name" ? "Search officer name..." :
                        searchField === "cadre" ? "Search cadre/post..." :
                        searchField === "station" ? "Search station/MDA..." :
                        "Search cards..."
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-2.5 pr-7 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {displayNominalRoll.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                  No directory cards found matching query criteria {search && `("${search}")`}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayNominalRoll.map((s) => (
                    <div key={s.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-emerald-500 transition-all flex gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                        {s.surname?.[0] || ""}{s.first_name?.[0] || ""}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono text-emerald-700 font-bold">{s.staff_number}</div>
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {s.surname}, {s.first_name}
                        </h3>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">{s.designation?.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.department?.name}</div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {s.grade_level?.name} Step {s.step}
                          </span>
                          <button
                            onClick={() => {
                              setProfileTab("particulars");
                              setSelectedStaff(s);
                            }}
                            className="text-xs text-emerald-700 hover:underline font-semibold"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MILESTONES & STATUTORY EXIT ALERTS */}
          {activeTab === "milestones" && (
            <MilestoneAlerts
              apiBase={API_BASE}
              onSelectStaff={(staff) => {
                setProfileTab("particulars");
                setSelectedStaff(staff);
              }}
            />
          )}

          {/* TAB 5: DATA IMPORT (CSV) */}
          {activeTab === "import" && permissions.canImport && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Import Staff Data (CSV)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload an official Ogun State nominal roll spreadsheet. Records are verified row-by-row before insertion.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg gap-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Download Official CSV Template</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Includes reference columns for Department codes, Grade Levels, and DOFA/DOB.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCsv("template", "BIT_Nominal_Roll_Template.csv")}
                    className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800 shadow-xs shrink-0"
                  >
                    ⬇ Download Template (.csv)
                  </button>
                </div>

                <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 sm:p-8 text-center hover:border-emerald-600 transition-colors">
                    <svg className="mx-auto h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="mt-3 text-xs text-slate-600">
                      <label className="font-semibold text-emerald-700 cursor-pointer hover:underline">
                        Choose CSV File
                        <input
                          type="file"
                          accept=".csv, text/csv"
                          onChange={(e) => setImportFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <span> or drag and drop here</span>
                    </div>
                    {importFile && (
                      <div className="mt-2 text-xs font-semibold text-slate-800 bg-slate-100 py-1 px-3 rounded inline-block">
                        Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!importFile || importing}
                      className="px-5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800 disabled:opacity-50 shadow-xs"
                    >
                      {importing ? "Validating & Importing..." : "Process Import"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className={`p-5 rounded-lg border ${importResult.success ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <h3 className={`text-sm font-bold ${importResult.success ? "text-emerald-900" : "text-rose-900"}`}>
                    {importResult.success ? "Batch Import Completed Successfully" : "Import Validation Failed"}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Processed {importResult.total_rows || 0} rows: {importResult.imported_count || 0} successfully imported, {importResult.failed_count || 0} failed.
                  </p>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-4 bg-white rounded border border-rose-200 overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead>
                          <tr className="bg-rose-100/70 text-rose-900 font-semibold border-b border-rose-200">
                            <th className="py-2 px-3">Row</th>
                            <th className="py-2 px-3">Staff ID</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Validation Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {importResult.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-rose-50/50">
                              <td className="py-2 px-3 font-bold text-rose-800">Row {err.row}</td>
                              <td className="py-2 px-3 font-mono">{err.staff_number}</td>
                              <td className="py-2 px-3">{err.name}</td>
                              <td className="py-2 px-3 text-rose-700">
                                <ul className="list-disc list-inside space-y-0.5">
                                  {err.errors.map((msg, idx) => (
                                    <li key={idx}>{msg}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === "audit" && permissions.canViewAudit && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Immutable Audit Logs</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Append-only record of all administrative operations, staff creations, edits, and bulk imports.
                  </p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-900"
                >
                  🔄 Refresh Logs
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 bg-white border border-slate-200 rounded-lg p-3">
                <input
                  type="search"
                  value={auditFilters.search}
                  onChange={(event) => updateAuditFilter("search", event.target.value)}
                  placeholder="Search username, IP, action, record..."
                  aria-label="Search audit logs"
                  className="xl:col-span-2 px-3 py-2 border border-slate-300 rounded text-xs"
                />
                <select value={auditFilters.action} onChange={(event) => updateAuditFilter("action", event.target.value)} className="px-3 py-2 border border-slate-300 rounded text-xs" aria-label="Filter by action">
                  <option value="">All actions</option>
                  {auditMeta.actions.map((action) => <option key={action} value={action}>{action}</option>)}
                </select>
                <select value={auditFilters.module} onChange={(event) => updateAuditFilter("module", event.target.value)} className="px-3 py-2 border border-slate-300 rounded text-xs" aria-label="Filter by module">
                  <option value="">All modules</option>
                  {auditMeta.modules.map((module) => <option key={module} value={module}>{module}</option>)}
                </select>
                <div className="flex gap-2">
                  <label className="flex-1 text-[10px] text-slate-500">From
                    <input type="date" value={auditFilters.from} onChange={(event) => updateAuditFilter("from", event.target.value)} className="block w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800" />
                  </label>
                  <label className="flex-1 text-[10px] text-slate-500">To
                    <input type="date" value={auditFilters.to} onChange={(event) => updateAuditFilter("to", event.target.value)} className="block w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800" />
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLoading ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">Loading audit history...</td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">No audit logs recorded yet.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{log.username || "Unknown"}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.action.includes("CREATE") || log.action.includes("IMPORT")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.action.includes("UPDATE")
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{log.module}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{log.ip_address || "Not recorded"}</td>
                          <td className="py-3 px-4">
                            {(log.previous_values || log.new_values) && (
                              <button
                                onClick={() => setAuditDetail(log)}
                                className="text-emerald-700 hover:underline font-semibold"
                              >
                                View Diff
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <span>
                  {auditMeta.total === 0 ? "No matching records" : `Showing ${(auditMeta.current_page - 1) * 25 + 1}-${Math.min(auditMeta.current_page * 25, auditMeta.total)} of ${auditMeta.total} records`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAuditPage((page) => Math.max(1, page - 1))}
                    disabled={auditPage <= 1 || auditLoading}
                    className="px-3 py-1.5 border border-slate-300 rounded disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span>Page {auditMeta.current_page} of {auditMeta.last_page}</span>
                  <button
                    type="button"
                    onClick={() => setAuditPage((page) => Math.min(auditMeta.last_page, page + 1))}
                    disabled={auditPage >= auditMeta.last_page || auditLoading}
                    className="px-3 py-1.5 border border-slate-300 rounded disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD / EDIT STAFF MODAL (RESPONSIVE) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-4 sm:p-6 space-y-4 border border-slate-200 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingStaffId ? "Edit Staff Record" : "Add New Staff Member"}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in official Ogun State public-service particulars for the Bureau of Information Technology.
                </p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Section 1: Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Staff ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.staff_number}
                    onChange={(e) => setFormData({ ...formData, staff_number: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                  {formErrors.staff_number && <p className="text-rose-600 text-[10px] mt-0.5">{formErrors.staff_number[0]}</p>}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">OG Number (Civil Service)</label>
                  <input
                    type="text"
                    placeholder="e.g. 21442"
                    value={formData.ogun_employee_number}
                    onChange={(e) => setFormData({ ...formData, ogun_employee_number: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">File Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BIT/PF/019"
                    value={formData.file_number}
                    onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Title</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Miss">Miss</option>
                    <option value="Engr.">Engr.</option>
                    <option value="Engr. (Mrs.)">Engr. (Mrs.)</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Surname (in Caps) *</label>
                  <input
                    type="text"
                    required
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Origin, Qualifications & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Birth (DOB) *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">LGA of Origin (Ogun) *</label>
                  <select
                    required
                    value={formData.lga_of_origin}
                    onChange={(e) => setFormData({ ...formData, lga_of_origin: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    {OGUN_LGAS.map((lga) => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Qualifications *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Sc Comp. Sci, HND, ND"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.official_email}
                    onChange={(e) => setFormData({ ...formData, official_email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Section 3: Department, Unit & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department *</label>
                  <select
                    required
                    disabled={permissions.isDeptRestricted}
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value, unit_id: "" })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">Select Department</option>
                    {lookups.departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit *</label>
                  <select
                    required
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">Select Unit</option>
                    {filteredUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation *</label>
                  <select
                    required
                    value={formData.designation_id}
                    onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">Select Designation</option>
                    {lookups.designations.map((desig) => (
                      <option key={desig.id} value={desig.id}>{desig.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 4: Current Station & Posting Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Current Station / Posting Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIT HQ, Ogun Tech Hub, Kobape OR Posted: Ministry of Finance"
                    value={formData.current_station}
                    onChange={(e) => setFormData({ ...formData, current_station: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Specify if serving at BIT HQ or posted to an external Ministry/Agency.</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Posting Status *</label>
                  <select
                    required
                    value={formData.employment_status_id}
                    onChange={(e) => setFormData({ ...formData, employment_status_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    {lookups.statuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 5: Grade Level, Step & Service Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Grade Level *</label>
                  <select
                    required
                    value={formData.grade_level_id}
                    onChange={(e) => setFormData({ ...formData, grade_level_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">Select Level</option>
                    {lookups.grade_levels.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Step (1 - 15) *</label>
                  <select
                    required
                    value={formData.step}
                    onChange={(e) => setFormData({ ...formData, step: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  >
                    {[...Array(15)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Step {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date 1st Appt (DOFA) *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_first_appointment}
                    onChange={(e) => setFormData({ ...formData, date_of_first_appointment: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Confirmation</label>
                  <input
                    type="date"
                    value={formData.date_of_confirmation}
                    onChange={(e) => setFormData({ ...formData, date_of_confirmation: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date Present Appt (DOPA) *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_present_appointment}
                    onChange={(e) => setFormData({ ...formData, date_of_present_appointment: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks / Special Appointment Note</label>
                <input
                  type="text"
                  placeholder="e.g. Special Adviser to Governor on Information Technology"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Dynamic Live Retirement Preview Card */}
              {calculatedRetirement && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Statutory Expected Retirement Date
                    </span>
                    <span className="text-xs font-semibold text-amber-900">
                      {calculatedRetirement.date} — Determined by: {calculatedRetirement.reason}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-mono text-left sm:text-right">
                    Age 60: {calculatedRetirement.byAge} <br />
                    35 Yrs Service: {calculatedRetirement.byService}
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submitting ? "Saving Record..." : editingStaffId ? "Update Staff Record" : "Save New Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STAFF PROFILE DETAILS VIEW (RESPONSIVE) */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-xl max-w-4xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-inner shrink-0">
                  {selectedStaff.surname?.[0] || ""}{selectedStaff.first_name?.[0] || ""}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ID: {selectedStaff.staff_number}
                    </span>
                    {selectedStaff.ogun_employee_number && (
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        OG No: {selectedStaff.ogun_employee_number}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate mt-1">
                    {selectedStaff.title} <span className="uppercase">{selectedStaff.surname}</span>, {selectedStaff.first_name} {selectedStaff.middle_name}
                  </h3>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {selectedStaff.designation?.name}
                    {selectedStaff.designation?.cadre_name && (
                      <span className="text-emerald-700 font-normal"> • {selectedStaff.designation.cadre_name}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pt-1">
              <button
                type="button"
                onClick={() => setProfileTab("particulars")}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  profileTab === "particulars"
                    ? "border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>📋</span>
                <span>Civil Service Particulars</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("postings")}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  profileTab === "postings"
                    ? "border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>📍</span>
                <span>Postings & Deployments</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("documents")}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  profileTab === "documents"
                    ? "border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>📁</span>
                <span>Digital Personnel Folder</span>
              </button>
            </div>

            {/* SUBTAB 1: CIVIL SERVICE PARTICULARS */}
            {profileTab === "particulars" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Department</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.department?.name || "Bureau Directorate"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Unit</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.unit?.name || "General Service"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Grade Level & Step</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.grade_level?.name} Step {selectedStaff.step}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Gender & Sex</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.gender} ({selectedStaff.gender === "Female" ? "F" : "M"})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedStaff.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">LGA & State of Origin</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.lga_of_origin || "Abeokuta"}, {selectedStaff.state_of_origin || "Ogun State"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Qualifications</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.qualification || "B.Sc / HND"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">File / Record Number</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedStaff.file_number || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of 1st Appt (DOFA)</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedStaff.date_of_first_appointment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Confirmation</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedStaff.date_of_confirmation || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date Present Appt (DOPA)</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedStaff.date_of_present_appointment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Official Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedStaff.official_email}</span>
                </div>

                <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Station / Posting Location</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedStaff.current_station && selectedStaff.current_station.includes("Posted") ? (
                      <span className="text-amber-900 font-bold">📍 {selectedStaff.current_station}</span>
                    ) : (
                      <span>🏛 {selectedStaff.current_station || "BIT Headquarters, Ogun Tech Hub, Kobape Road, Kobape, Abeokuta"}</span>
                    )}
                  </span>
                  {selectedStaff.remarks && (
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      Remarks: {selectedStaff.remarks}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 bg-amber-50 p-2.5 rounded border border-amber-200">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">Expected Statutory Retirement Date</span>
                  <span className="text-xs font-bold text-amber-900">{selectedStaff.expected_retirement_date}</span>
                </div>
              </div>
            )}

            {/* SUBTAB 2: POSTINGS & DEPLOYMENT TRACKER */}
            {profileTab === "postings" && (
              <div className="pt-1">
                <StaffPostingsTab
                  staff={selectedStaff}
                  apiBase={API_BASE}
                  permissions={permissions}
                  onStaffUpdated={(updated) => {
                    setSelectedStaff(updated);
                    fetchStaff();
                  }}
                />
              </div>
            )}

            {/* SUBTAB 3: DIGITAL PERSONNEL FOLDER */}
            {profileTab === "documents" && (
              <div className="pt-1">
                <StaffDocumentsTab
                  staff={selectedStaff}
                  apiBase={API_BASE}
                  permissions={permissions}
                />
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-1.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded hover:bg-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT DIFF VIEWER */}
      {auditDetail && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Operation Diff</h3>
                <p className="text-xs text-slate-500">
                  {auditDetail.action} by {auditDetail.username} on {new Date(auditDetail.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setAuditDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {auditDetail.previous_values && (
                <div>
                  <div className="font-bold text-slate-700 mb-1">Previous Values:</div>
                  <pre className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(auditDetail.previous_values, null, 2)}
                  </pre>
                </div>
              )}
              {auditDetail.new_values && (
                <div>
                  <div className="font-bold text-slate-700 mb-1">New Values:</div>
                  <pre className="bg-emerald-50 p-2.5 rounded border border-emerald-200 font-mono text-[11px] overflow-x-auto text-emerald-900">
                    {JSON.stringify(auditDetail.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setAuditDetail(null)} className="px-4 py-1.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded hover:bg-slate-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={(msg) => setFeedback({ type: "success", message: msg })}
        apiBase={API_BASE}
      />

      {/* MODAL 5: MANDATORY FIRST LOGIN ONBOARDING MODAL */}
      {currentUser?.is_first_login && (
        <FirstLoginModal
          currentUser={currentUser}
          apiBase={API_BASE}
          onComplete={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("bit_hrms_user", JSON.stringify(updatedUser));
            setFeedback({
              type: "success",
              message: `Welcome, ${updatedUser.name}! Your password has been updated and officer profile registered.`,
            });
          }}
        />
      )}

      {/* MODAL 6: SUPERADMIN SYSTEM USER MANAGEMENT MODAL */}
      {isUserModalOpen && (
        <UserManagementModal
          apiBase={API_BASE}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}
    </div>
  );
}
