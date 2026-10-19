import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", padding: "20px", fontFamily: "sans-serif" }}>
          <div style={{ maxWidth: "600px", width: "100%", backgroundColor: "#ffffff", borderRadius: "12px", padding: "30px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <span style={{ fontSize: "28px" }}>⚠️</span>
              <div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: "bold" }}>Bureau of Information Technology — Error Alert</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>A client runtime error was caught by the system boundary.</p>
              </div>
            </div>
            <pre style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", fontSize: "12px", overflowX: "auto" }}>
              {this.state.error?.toString()}
            </pre>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  localStorage.removeItem("bit_hrms_token");
                  localStorage.removeItem("bit_hrms_user");
                  window.location.reload();
                }}
                style={{ backgroundColor: "#047857", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
              >
                Reset Session & Sign In Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{ backgroundColor: "#e2e8f0", color: "#334155", border: "none", padding: "10px 18px", borderRadius: "8px", fontSize: "12px", fontWeight: "semibold", cursor: "pointer" }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
