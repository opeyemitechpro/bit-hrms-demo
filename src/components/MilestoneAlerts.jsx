import React, { useState, useEffect } from "react";
import axios from "axios";
import RetirementNoticeModal from "./RetirementNoticeModal";

export default function MilestoneAlerts({ apiBase, onSelectStaff }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("confirmation_due"); // confirmation_due, retirements_12m, overdue
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/alerts/milestones`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load milestone alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const handleOpenNotice = async (staffId) => {
    setNoticeLoading(true);
    try {
      const res = await axios.get(`${apiBase}/alerts/notice-letter/${staffId}`);
      if (res.data.success) {
        setSelectedNotice(res.data.data);
      }
    } catch (err) {
      console.error("Failed to generate notice letter", err);
    } finally {
      setNoticeLoading(false);
    }
  };

  const counts = data?.counts || { confirmation_due: 0, retirements_12m: 0, retirements_6m: 0, retirements_3m: 0, overdue: 0 };
  const currentList = data ? data[activeSubTab] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
              Statutory Governance Engine
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight mt-1">
            Civil Service Milestone & Retirement Alerts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated monitoring of mandatory 2-year confirmation and 60-year age / 35-year service statutory limits.
          </p>
        </div>
        <button
          onClick={fetchMilestones}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>🔄</span>
          <span>Refresh Engine</span>
        </button>
      </div>

      {/* KPI Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Confirmation Due */}
        <div
          onClick={() => setActiveSubTab("confirmation_due")}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            activeSubTab === "confirmation_due"
              ? "bg-blue-50/80 border-blue-500 shadow-xs"
              : "bg-white border-slate-200 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Confirmation Due</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
              Rule 020701
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{counts.confirmation_due}</div>
          <div className="text-[10px] text-slate-400 mt-1">Served &ge; 2 years without gazetted confirmation</div>
        </div>

        {/* Card 2: Upcoming Retirements */}
        <div
          onClick={() => setActiveSubTab("retirements_12m")}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            activeSubTab === "retirements_12m"
              ? "bg-amber-50/80 border-amber-500 shadow-xs"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Retirements (Next 12M)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
              Rule 020810
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{counts.retirements_12m}</div>
          <div className="text-[10px] text-slate-400 mt-1">Officers attaining age 60 or 35 years service</div>
        </div>

        {/* Card 3: Overdue Retirements */}
        <div
          onClick={() => setActiveSubTab("overdue")}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            activeSubTab === "overdue"
              ? "bg-rose-50/80 border-rose-500 shadow-xs"
              : "bg-white border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Overdue Exits</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
              Immediate Action
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{counts.overdue}</div>
          <div className="text-[10px] text-slate-400 mt-1">Officers past their statutory disengagement date</div>
        </div>
      </div>

      {/* Tab Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>
              {activeSubTab === "confirmation_due" && "📋 Officers Due for 2-Year Statutory Confirmation"}
              {activeSubTab === "retirements_12m" && "⏳ Officers Due for Statutory Retirement (Next 12 Months)"}
              {activeSubTab === "overdue" && "⚠️ Officers Overdue for Statutory Retirement"}
            </span>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
              {currentList.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                <th className="py-2.5 px-3 min-w-[80px]">OG No.</th>
                <th className="py-2.5 px-3 min-w-[180px]">Full Name</th>
                <th className="py-2.5 px-3 min-w-[160px]">Designation & Cadre</th>
                <th className="py-2.5 px-3 w-16 text-center">GL</th>
                <th className="py-2.5 px-3 min-w-[100px]">1st Appt. Date</th>
                {activeSubTab === "confirmation_due" ? (
                  <th className="py-2.5 px-3 min-w-[140px]">Years in Service</th>
                ) : (
                  <th className="py-2.5 px-3 min-w-[140px] text-amber-800">Retirement Date</th>
                )}
                <th className="py-2.5 px-3 text-center min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading statutory alerts engine...</td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No officers currently flagged under this statutory category.
                  </td>
                </tr>
              ) : (
                currentList.map((staff, idx) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {staff.ogun_employee_number || staff.staff_number}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <span className="uppercase">{staff.surname}</span>, {staff.title ? `${staff.title} ` : ""}{staff.first_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{staff.designation?.name}</div>
                      <div className="text-[10px] text-slate-400">{staff.department?.name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700 bg-slate-50/50">
                      {staff.grade_level?.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {staff.date_of_first_appointment}
                    </td>

                    {activeSubTab === "confirmation_due" ? (
                      <td className="py-2.5 px-3 font-bold text-blue-700">
                        {Math.floor((new Date() - new Date(staff.date_of_first_appointment)) / (1000 * 60 * 60 * 24 * 365.25))} Years (Unconfirmed)
                      </td>
                    ) : (
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-800 bg-amber-50/40">
                        {staff.expected_retirement_date}
                      </td>
                    )}

                    <td className="py-2.5 px-3 text-center space-x-2">
                      <button
                        onClick={() => onSelectStaff(staff)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenNotice(staff.id)}
                        disabled={noticeLoading}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[11px] transition-colors"
                      >
                        📜 Generate Notice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice Letter Modal */}
      <RetirementNoticeModal
        isOpen={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        noticeData={selectedNotice}
      />
    </div>
  );
}
