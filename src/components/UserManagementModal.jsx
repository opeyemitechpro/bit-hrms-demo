import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pagination, QuickFilters, RecordFilters } from "./RecordControls";
import { CircleCheck, Plus, TriangleAlert, X } from "lucide-react";

export default function UserManagementModal({ onClose, apiBase }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "", role_id: "", department_id: "" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [position, setPosition] = useState({ key: "", page: 1 });
  const [perPage, setPerPage] = useState(25);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const queryKey = JSON.stringify([debouncedSearch, filters.status, filters.role_id, filters.department_id, perPage]);
  const page = position.key === queryKey ? position.page : 1;
  const setPage = (value) => setPosition({ key: queryKey, page: value });
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    setPosition({ key: queryKey, page: 1 });
  }, [queryKey]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_id: "",
    department_id: "",
    designation: "",
    grade_level: "GL 08",
    status: "active",
  });

  const fetchUsers = async (signal) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/admin/users`, { params: { ...filters, search: debouncedSearch, page, per_page: perPage }, signal });
      if (res.data.success) {
        setUsers(res.data.data.data || res.data.data);
        setMeta(res.data.data);
        if (page > res.data.data.last_page) setPage(res.data.data.last_page);
        if (res.data.meta) {
          setRoles(res.data.meta.roles || []);
          setDepartments(res.data.meta.departments || []);
          if (res.data.meta.roles?.length && !form.role_id) {
            setForm((prev) => ({ ...prev, role_id: res.data.meta.roles[0].id }));
          }
        }
      }
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError("Failed to load users list. Please try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [queryKey, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await axios.post(`${apiBase}/admin/users`, form);
      if (res.data.success) {
        setSuccessMsg(`User ${res.data.data.name} created successfully! They will be prompted to change their password and complete their profile on first login.`);
        setForm({
          name: "",
          username: "",
          email: "",
          password: "",
          role_id: roles[0]?.id || "",
          department_id: "",
          designation: "",
          grade_level: "GL 08",
          status: "active",
        });
        setShowAddForm(false);
        fetchUsers();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Failed to create user account.");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                Superadmin Control Panel
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              System User Management & Access Control
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision administrative personnel accounts with role-based governance. New accounts are required to change their password on first login.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            <X size={18} aria-label="Close user management" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span><TriangleAlert size={15} className="inline-block mr-1" />{error}</span>
            <button onClick={() => setError("")} className="font-bold" aria-label="Dismiss error"><X size={15} /></button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span><CircleCheck size={15} className="inline-block mr-1" />{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="font-bold" aria-label="Dismiss notification"><X size={15} /></button>
          </div>
        )}

        {/* Action bar */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700">
            User Accounts ({meta.total})
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}<span>{showAddForm ? "Cancel" : "Create New User"}</span>
          </button>
        </div>

        {/* Create User Form Drawer */}
        <RecordFilters search={filters.search} onSearch={(value) => updateFilter("search", value)} onReset={() => setFilters({ search: "", status: "", role_id: "", department_id: "" })} label="Search user accounts">
          <select value={filters.role_id} onChange={(event) => updateFilter("role_id", event.target.value)} aria-label="Filter user role" className="px-3 py-2 border border-slate-300 rounded text-xs max-w-full">
            <option value="">All roles</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
          <select value={filters.department_id} onChange={(event) => updateFilter("department_id", event.target.value)} aria-label="Filter user department" className="px-3 py-2 border border-slate-300 rounded text-xs max-w-full">
            <option value="">All departments</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </RecordFilters>
        <QuickFilters options={[{ key: "", label: "All accounts" }, { key: "active", label: "Active" }, { key: "suspended", label: "Suspended" }, { key: "inactive", label: "Inactive" }]} value={filters.status} onChange={(value) => updateFilter("status", value)} label="Account status quick filters" />
        <Pagination page={meta.current_page} lastPage={meta.last_page} total={meta.total} perPage={perPage} onPage={setPage} onPerPage={setPerPage} loading={loading} />
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              Provision New Officer User Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adebayo Ogunlesi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aogunlesi"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. a.ogunlesi@ogunstate.gov.ng"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">System Role *</label>
                <select
                  required
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="">None / Agency Wide</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Systems Analyst"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Grade Level</label>
                <input
                  type="text"
                  placeholder="e.g. GL 10"
                  value={form.grade_level}
                  onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {submitting ? "Creating Account..." : "Confirm & Create User"}
              </button>
            </div>
          </form>
        )}

        {/* User Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">Officer Name</th>
                <th className="py-2.5 px-3">Username & Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Designation / GL</th>
                <th className="py-2.5 px-3 text-center">First Login Status</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Loading system users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="font-mono font-medium text-slate-800">{u.username}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {u.role?.name || u.role?.code || "User"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{u.designation || "—"}</div>
                      <div className="text-[10px] text-slate-400">{u.grade_level || "—"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {u.is_first_login ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Pending Onboarding
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
