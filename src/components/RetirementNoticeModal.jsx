import React from "react";

export default function RetirementNoticeModal({ isOpen, onClose, noticeData }) {
  if (!isOpen || !noticeData) return null;

  const staff = noticeData.staff;
  const rules = noticeData.statutory_rules;
  const sig = noticeData.signatory;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex justify-between items-center print:hidden border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
              Statutory Civil Service Notice
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>🖨️</span>
              <span>Print Letter (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Formal Civil Service Letter Layout */}
        <div className="print-letter space-y-5 text-slate-900 font-serif text-xs sm:text-sm leading-relaxed">
          {/* Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="flex justify-center items-center gap-3">
              <img
                src="/images/ogun_state_logo.png"
                alt="Ogun State Crest"
                className="h-16 w-16 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-800 mt-1">
              OGUN STATE GOVERNMENT OF NIGERIA
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase text-slate-950">
              BUREAU OF INFORMATION TECHNOLOGY
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-600 font-sans italic">
              Ogun Tech Hub, Kobape Road, Kobape, Abeokuta, Ogun State.
            </p>
          </div>

          {/* Reference & Date */}
          <div className="flex justify-between items-center text-xs font-mono pt-2">
            <div>
              <strong>Ref. No:</strong> {noticeData.reference_number}
            </div>
            <div>
              <strong>Date:</strong> {noticeData.date}
            </div>
          </div>

          {/* Addressee */}
          <div className="pt-2 text-xs space-y-0.5">
            <div className="font-bold text-slate-950">
              {staff.title} {staff.surname.toUpperCase()}, {staff.first_name} {staff.middle_name || ""}
            </div>
            <div>OG No: <span className="font-mono font-bold">{staff.ogun_employee_number || staff.staff_number}</span></div>
            <div>{staff.designation?.name} ({staff.grade_level?.name})</div>
            <div>{staff.department?.name}</div>
            <div className="text-slate-600 italic">{staff.current_station}</div>
          </div>

          {/* Salutation */}
          <div className="pt-2">
            Dear {staff.title} {staff.surname},
          </div>

          {/* Subject */}
          <div className="font-bold text-slate-950 underline uppercase text-center pt-2 tracking-wide text-xs sm:text-sm">
            STATUTORY RETIREMENT NOTIFICATION FROM THE PUBLIC SERVICE
          </div>

          {/* Letter Body */}
          <div className="space-y-3 pt-2 text-justify">
            <p>
              I am directed to bring to your attention that in accordance with the provisions of{" "}
              <strong>{rules.rule}</strong> of the Ogun State Public Service, all officers are statutorily required to retire from service upon attaining sixty (60) years of age or completing thirty-five (35) years of pensionable public service, whichever occurs earlier.
            </p>
            <p>
              According to the official Nominal Roll records of the Bureau of Information Technology:
            </p>
            <div className="bg-slate-50 p-3 rounded border border-slate-200 font-sans text-xs space-y-1 my-2">
              <div className="grid grid-cols-2 gap-2">
                <div>• Date of Birth: <strong>{staff.date_of_birth}</strong></div>
                <div>• Current Age: <strong>{rules.age?.toString().includes('Year') ? rules.age : `${rules.age} Years`}</strong></div>
                <div>• Date of First Appointment: <strong>{staff.date_of_first_appointment}</strong></div>
                <div>• Length of Service: <strong>{rules.years_in_service?.toString().includes('Year') ? rules.years_in_service : `${rules.years_in_service} Years`}</strong></div>
              </div>
              <div className="pt-1 text-emerald-900 font-bold border-t border-slate-200 mt-2">
                • Statutory Expected Retirement Date: <u>{staff.expected_retirement_date}</u>
              </div>
            </div>
            <p>
              Consequently, you are hereby formally reminded that your disengagement from active service will take effect on{" "}
              <strong>{staff.expected_retirement_date}</strong>. You are advised to initiate the documentation of your statutory retirement particulars and pension papers with the Ogun State Civil Service Commission and Pension Bureau not later than six (6) months prior to this date.
            </p>
            <p>
              The Bureau profoundly commends your dedicated and meritorious contributions to the growth and digital development of the Bureau and Ogun State Public Service.
            </p>
          </div>

          {/* Signatory Block */}
          <div className="pt-8 space-y-1 text-xs">
            <div>Yours faithfully,</div>
            <div className="pt-8">______________________________________</div>
            <div className="font-bold text-slate-950">{sig.title}</div>
            <div className="text-slate-600">For: {sig.for}</div>
            <div className="text-slate-500 italic">{sig.agency}, {sig.state}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
