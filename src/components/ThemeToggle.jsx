import React, { createContext, useContext, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "bit_hrms_theme";

function savedPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return ["light", "dark"].includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(savedPreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (event) => setSystemDark(event.matches);
    const sync = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setPreference(savedPreference());
    };
    setSystemDark(media.matches);
    media.addEventListener("change", update);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const selectTheme = (value) => {
    setPreference(value);
    try {
      if (value === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch {}
  };

  return <ThemeContext.Provider value={{ theme, preference, selectTheme }}>{children}</ThemeContext.Provider>;
}

export default function ThemeToggle() {
  const { theme, preference, selectTheme } = useContext(ThemeContext);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <div role="group" aria-label="Color theme" className="flex shrink-0 items-center gap-1">
      <button type="button" title={`Switch to ${next} theme`} aria-label={`Switch to ${next} theme`} onClick={() => selectTheme(next)}
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button type="button" title="Use device theme" aria-label="Use device theme" aria-pressed={preference === "system"} onClick={() => selectTheme("system")}
        className={`inline-flex h-8 w-8 items-center justify-center rounded border ${preference === "system" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"}`}>
        <Monitor size={16} />
      </button>
    </div>
  );
}