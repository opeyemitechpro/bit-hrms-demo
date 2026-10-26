import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pagination, QuickFilters, RecordFilters, useRecordPage } from "./RecordControls";
import { Award, Building2, FileText, FolderOpen, GraduationCap, Paperclip, TrendingUp, Upload, UserRound, X } from "lucide-react";

export default function StaffDocumentsTab({ staff, apiBase, permissions }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("DEGREE_CERTIFICATE");
  const [file, setFile] = useState(null);
  const records = useRecordPage(documents, staff.id);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/staff/${staff.id}/documents`);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staff?.id) {
      fetchDocuments();
    }
  }, [staff?.id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("document_type", documentType);
    formData.append("file", file);

    try {
      const res = await axios.post(`${apiBase}/staff/${staff.id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setTitle("");
        setFile(null);
        setShowUploadForm(false);
        fetchDocuments();
      }
    } catch (err) {
      setError(err.response?.data?.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Are you sure you want to remove this document from the personnel folder?")) return;
    try {
      await axios.delete(`${apiBase}/staff/${staff.id}/documents/${docId}`);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const typeLabels = {
    APPOINTMENT_LETTER: "First Appointment Letter",
    CONFIRMATION_GAZETTE: "Confirmation Gazette",
    DEGREE_CERTIFICATE: "Academic Degree / HND",
    NYSC_DISCHARGE: "NYSC Discharge Certificate",
    PASSPORT_PHOTO: "Official Passport Photograph",
    PROMOTION_LETTER: "Letter of Promotion",
    OTHER: "Civil Service Document",
  };

  const typeIcons = {
    APPOINTMENT_LETTER: <FileText size={20} />,
    CONFIRMATION_GAZETTE: <Building2 size={20} />,
    DEGREE_CERTIFICATE: <GraduationCap size={20} />,
    NYSC_DISCHARGE: <Award size={20} />,
    PASSPORT_PHOTO: <UserRound size={20} />,
    PROMOTION_LETTER: <TrendingUp size={20} />,
    OTHER: <FileText size={20} />,
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-800">Digital Personnel Folder</h4>
          <p className="text-[11px] text-slate-500">Statutory public service credentials, appointment letters, and certificates.</p>
        </div>
        {permissions?.canEditStaff && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-3 py-1.5 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
          >
            {showUploadForm ? <X size={15} /> : <Upload size={15} />}<span>{showUploadForm ? "Close" : "Upload Document"}</span>
          </button>
        )}
      </div>

      {/* Upload Form Modal/Box */}
      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Paperclip size={15} />
            <span>Upload New Officer Credential</span>
          </div>

          {error && <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Document Category *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 bg-white"
              >
                <option value="DEGREE_CERTIFICATE">Academic Degree / HND / ND</option>
                <option value="APPOINTMENT_LETTER">1st Appointment Letter</option>
                <option value="CONFIRMATION_GAZETTE">Confirmation Gazette / Letter</option>
                <option value="NYSC_DISCHARGE">NYSC Discharge / Exemption</option>
                <option value="PROMOTION_LETTER">Last Promotion Letter</option>
                <option value="PASSPORT_PHOTO">Official Passport Photo</option>
                <option value="OTHER">Other Official Document</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. B.Sc Computer Science Certificate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Select File (PDF, PNG, JPG, DOCX - Max 10MB) *</label>
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 bg-white file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-1.5 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              {uploading ? "Uploading & Archiving..." : "Save to Personnel File"}
            </button>
          </div>
        </form>
      )}

      {/* Documents List */}
      <RecordFilters search={records.search} onSearch={records.setSearch} onReset={records.reset} label="Search personnel documents" />
      <QuickFilters options={[{ key: "", label: "All documents" }, ...Object.entries(typeLabels).map(([key, label]) => ({ key, label }))]} value={records.filter} onChange={records.setFilter} label="Document category quick filters" />
      {loading ? (
        <div className="py-6 text-center text-slate-400">Loading digital personnel folder...</div>
      ) : records.total === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
          <FolderOpen size={24} className="mx-auto mb-1" />
          <div className="font-semibold">No matching digital credentials.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.rows.map((doc) => (
            <div key={doc.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="shrink-0 p-1.5 bg-slate-100 rounded">{typeIcons[doc.document_type] || <FileText size={20} />}</span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block truncate">
                    {typeLabels[doc.document_type] || doc.document_type}
                  </span>
                  <div className="font-bold text-slate-900 truncate text-xs">{doc.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {Math.round(doc.file_size / 1024)} KB &bull; Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <a
                  href={`http://127.0.0.1:8000${doc.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-bold border border-emerald-200"
                >
                  View / Open
                </a>
                {permissions?.canArchiveStaff && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-rose-600 hover:text-rose-800 text-[10px] font-semibold"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={records.page} lastPage={records.lastPage} total={records.total} perPage={records.perPage} onPage={records.onPage} onPerPage={records.setPerPage} loading={loading} />
    </div>
  );
}
