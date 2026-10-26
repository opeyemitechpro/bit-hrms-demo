import React, { useState, useEffect } from "react";
import axios from "axios";
import StaffPostingsModal from "./StaffPostingsModal";
import { Pagination, QuickFilters, RecordFilters, useRecordPage } from "./RecordControls";
import { Building2, MapPin, RefreshCw } from "lucide-react";

export default function StaffPostingsTab({ staff, apiBase, permissions, onStaffUpdated }) {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const records = useRecordPage(postings, staff.id);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/staff/${staff.id}/postings`);
      if (res.data.success) {
        setPostings(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load postings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staff?.id) {
      fetchPostings();
    }
  }, [staff?.id]);

  const handlePostingSaved = (newPosting) => {
    fetchPostings();
    if (onStaffUpdated) {
      onStaffUpdated({
        ...staff,
        current_station: newPosting.station_name,
        date_of_last_deployment: newPosting.effective_date,
      });
    }
  };

  const getDeploymentBadge = (type) => {
    switch (type) {
      case "HEADQUARTERS":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold"><Building2 size={12} className="inline-block mr-1" />Headquarters</span>;
      case "POSTED":
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold"><MapPin size={12} className="inline-block mr-1" />External Posting</span>;
      case "SECONDED":
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-bold"><RefreshCw size={12} className="inline-block mr-1" />Secondment</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold"><Building2 size={12} className="inline-block mr-1" />Internal Movement</span>;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-800">Deployment & Secondment History</h4>
          <p className="text-[11px] text-slate-500">Chronological audit trail of duty stations, external MDA postings, and headquarters recalls.</p>
        </div>
        {permissions?.canEditStaff && (
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>+ Re-assign / Deploy</span>
          </button>
        )}
      </div>

      <RecordFilters search={records.search} onSearch={records.setSearch} onReset={records.reset} label="Search posting history" />
      <QuickFilters options={[{ key: "", label: "All movements" }, { key: "HEADQUARTERS", label: "Headquarters" }, { key: "POSTED", label: "External postings" }, { key: "SECONDED", label: "Secondments" }, { key: "INTERNAL_TRANSFER", label: "Internal transfers" }]} value={records.filter} onChange={records.setFilter} label="Deployment quick filters" />
      {loading ? (
        <div className="py-6 text-center text-slate-400">Loading posting history...</div>
      ) : records.total === 0 ? (
        <div className="py-6 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-400">
          No historical postings recorded for this officer.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {records.rows.map((p, index) => (
            <div key={p.id} className="relative">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  p.is_current ? "border-emerald-600 ring-4 ring-emerald-100" : "border-slate-400"
                }`}
              ></div>

              <div
                className={`p-3.5 rounded-lg border transition-all ${
                  p.is_current
                    ? "bg-emerald-50/40 border-emerald-300 shadow-xs"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {getDeploymentBadge(p.deployment_type)}
                    {p.is_current && (
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-1.5 py-0.2 rounded">
                        Current Station
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 font-semibold">
                    Effective: {p.effective_date} {p.end_date ? `to ${p.end_date}` : "(Present)"}
                  </div>
                </div>

                <div className="font-bold text-slate-900 text-xs mt-1">{p.station_name}</div>
                {p.mda_name && p.mda_name !== p.station_name && (
                  <div className="text-[11px] text-slate-600 mt-0.5">MDA: <strong>{p.mda_name}</strong></div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  {p.circular_reference && (
                    <div className="font-mono">
                      Ref: <strong className="text-slate-700">{p.circular_reference}</strong>
                    </div>
                  )}
                  {p.remarks && <div className="italic">{p.remarks}</div>}
                  {p.creator && <div>Logged by: {p.creator.name}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deployment Modal */}
      <Pagination page={records.page} lastPage={records.lastPage} total={records.total} perPage={records.perPage} onPage={records.onPage} onPerPage={records.setPerPage} loading={loading} />
      <StaffPostingsModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        staff={staff}
        apiBase={apiBase}
        onPostingSaved={handlePostingSaved}
      />
    </div>
  );
}
