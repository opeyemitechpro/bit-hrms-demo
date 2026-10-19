import React, { useState } from "react";
import axios from "axios";

export default function StaffPostingsModal({ isOpen, onClose, staff, apiBase, onPostingSaved }) {
  if (!isOpen || !staff) return null;

  const [deploymentType, setDeploymentType] = useState("POSTED");
  const [stationName, setStationName] = useState("");
  const [mdaName, setMdaName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [circularRef, setCircularRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await axios.post(`${apiBase}/staff/${staff.id}/postings`, {
        deployment_type: deploymentType,
        station_name: deploymentType === "HEADQUARTERS" ? "Bureau of Information Technology HQ, Ogun Tech Hub, Kobape Road, Kobape, Abeokuta" : stationName,
        mda_name: deploymentType === "HEADQUARTERS" ? "Bureau of Information Technology" : mdaName,
        effective_date: effectiveDate,
        circular_reference: circularRef,
        remarks: remarks,
      });

      if (res.data.success) {
        onPostingSaved(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log staff deployment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Official Movement Circular</div>
            <h3 className="text-base font-bold text-slate-900">
              Deploy / Re-assign Officer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {staff.title} {staff.surname.toUpperCase()}, {staff.first_name} (OG No: {staff.ogun_employee_number || staff.staff_number})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Deployment Type *</label>
            <select
              value={deploymentType}
              onChange={(e) => setDeploymentType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
            >
              <option value="POSTED">📍 Posted to External MDA</option>
              <option value="SECONDED">🔄 Secondment (Special Assignment)</option>
              <option value="HEADQUARTERS">🏛 Recalled to BIT Headquarters</option>
              <option value="INTERNAL_TRANSFER">🏢 Internal Directorate Transfer</option>
            </select>
          </div>

          {deploymentType !== "HEADQUARTERS" && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">External MDA Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ministry of Finance OR Ministry of Justice"
                  value={mdaName}
                  onChange={(e) => {
                    setMdaName(e.target.value);
                    if (!stationName || stationName.startsWith("Posted:")) {
                      setStationName(`Posted: ${e.target.value}`);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Station Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Posted: Dept. of Public Prosecution, Ministry of Justice"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Effective Date *</label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Circular / Ref No.</label>
              <input
                type="text"
                placeholder="e.g. OG/CSC/POST/2026/08"
                value={circularRef}
                onChange={(e) => setCircularRef(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Administrative Remarks / Terms</label>
            <textarea
              rows={2}
              placeholder="e.g. Deployment approved pursuant to civil service circular on ICT staff rationalization."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving Deployment..." : "Confirm Deployment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
