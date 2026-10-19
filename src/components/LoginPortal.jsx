import React, { useState } from "react";

export default function LoginPortal({ onLogin, loading, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Pre-configured official demo roles for evaluation and auditing
  const demoAccounts = [
    {
      role: "Super Administrator",
      code: "SUPER_ADMIN",
      username: "superadmin",
      password: "password123",
      desc: "Full administrative clearance, audit inspection & system config",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      accent: "border-l-purple-600",
    },
    {
      role: "HR Administrator",
      code: "HR_ADMIN",
      username: "hradmin",
      password: "password123",
      desc: "Full HR management, CSV import/export & audit records",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      accent: "border-l-emerald-600",
    },
    {
      role: "HR Officer",
      code: "HR_OFFICER",
      username: "hrofficer",
      password: "password123",
      desc: "Staff enrollment, registry updates & nominal roll queries",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      accent: "border-l-blue-600",
    },
    {
      role: "Department Admin (Software)",
      code: "DEPT_ADMIN",
      username: "deptadmin",
      password: "password123",
      desc: "Scoped to Department 4 (Infrastructure & Software)",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      accent: "border-l-amber-600",
    },
    {
      role: "Viewer / Management",
      code: "VIEWER",
      username: "viewer",
      password: "password123",
      desc: "Read-only access for executive oversight & analytics",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      accent: "border-l-slate-600",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onLogin(username.trim(), password);
  };

  const handleSelectDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    onLogin(acc.username, acc.password);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Government Watermark Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-300 uppercase tracking-widest text-[11px]">
            Ogun State Government Security Gateway
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Public Service HRMS &bull; Version 1.0 Enterprise
        </div>
      </div>

      {/* Main Login Card Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero & Identity Banner */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start items-center gap-4">
              <img
                src="/images/ogun_state_logo.png"
                alt="Ogun State Government Seal"
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-full bg-white p-1 shadow-2xl border border-slate-700/60 ring-4 ring-emerald-500/20"
              />
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold tracking-widest text-emerald-400 uppercase">
                  OGUN STATE GOVERNMENT
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Bureau of Information Technology
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">
                  Ogun Tech Hub, Kobape Road, Kobape, Abeokuta
                </p>
              </div>
            </div>

            <div className="space-y-2 border-l-2 border-emerald-500 pl-4 py-1 text-left">
              <h2 className="text-lg font-bold text-white">
                Human Resource Management System (BIT-HRMS)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralized civil service nominal roll, cadre deployment registry, statutory retirement tracking, and role-based operational governance.
              </p>
            </div>

            {/* Public Service Compliance Notice */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 text-xs text-left space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Statutory Compliance & Data Privacy
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This portal is strictly authorized for designated Ogun State Public Service personnel. Processing of personal data complies with the Nigeria Data Protection Act (NDPA) 2023. Unauthorized access is recorded and subject to disciplinary and legal sanction.
              </p>
            </div>
          </div>

          {/* Right Login Form Container */}
          <div className="lg:col-span-6 bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Sign In to Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your official username or government email address
              </p>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2.5 animate-fadeIn">
                <svg className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. superadmin or hradmin"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Government Portal</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Quick Testing Accounts Section */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Quick Access Testing Roles (RBAC)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  1-Click Login
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.code}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    disabled={loading}
                    className={`p-2.5 rounded-lg border bg-slate-50 hover:bg-slate-100 text-left transition-all border-l-4 ${acc.accent} disabled:opacity-50 group hover:border-slate-300`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[11px] text-slate-800 group-hover:text-emerald-800">
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.desc}</div>
                    <div className="text-[9px] font-mono text-slate-400 mt-1">
                      User: <strong className="text-slate-700">{acc.username}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Bureau of Information Technology &bull; Ogun State Government, Nigeria. All Rights Reserved.
      </footer>
    </div>
  );
}
