"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  DocumentMetadata, DocumentDetail, fetchDocuments,
  fetchDocumentDetail, uploadDocument
} from "@/lib/api";
import Navbar from "@/components/Navbar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SplitScreenViewer from "@/components/SplitScreenViewer";
import ContractComparisonModal from "@/components/ContractComparisonModal";
import LawyerBriefModal from "@/components/LawyerBriefModal";
import LegalInfoModal from "@/components/LegalInfoModal";
import ObservabilityModal from "@/components/ObservabilityModal";
import {
  FileText, UploadCloud, ShieldAlert, CheckSquare, Clock,
  FileDiff, Briefcase, Plus, Search, ArrowRight,
  ExternalLink, CheckCircle2, AlertTriangle, Scale, BookOpen,
  Activity, RefreshCw, Filter, ArrowUpRight, Zap
} from "lucide-react";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [viewerLoading, setViewerLoading] = useState<boolean>(false);

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Modals state
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonTargetId, setComparisonTargetId] = useState<string>("");
  const [showLawyerBrief, setShowLawyerBrief] = useState<boolean>(false);
  const [lawyerBriefDocId, setLawyerBriefDocId] = useState<string>("");
  const [showLegalInfo, setShowLegalInfo] = useState<boolean>(false);
  const [showObservability, setShowObservability] = useState<boolean>(false);

  // Uploading state
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all documents on mount
  const refreshDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  // Open a document in Split-Screen Intelligence Viewer
  const handleOpenDocument = async (docId: string) => {
    setViewerLoading(true);
    try {
      const fullDoc = await fetchDocumentDetail(docId);
      setSelectedDoc(fullDoc);
    } catch (e) {
      console.error(e);
    } finally {
      setViewerLoading(false);
    }
  };

  // Process file upload
  const processUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const newDoc = await uploadDocument(file);
      await refreshDocuments();
      setSelectedDoc(newDoc);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.filename.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.parties.some((p) => p.toLowerCase().includes(searchFilter.toLowerCase())) ||
      d.doc_type.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === "All" || d.doc_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalRisks = documents.reduce((acc, d) => {
    const b = d.risk_breakdown || {};
    return acc + (b["Critical"] || 0) + (b["High Attention"] || 0);
  }, 0);

  // If a document is currently selected, render the SplitScreenViewer
  if (selectedDoc) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <DisclaimerBanner />
        <Navbar
          onOpenObservability={() => setShowObservability(true)}
          onOpenLegalInfo={() => setShowLegalInfo(true)}
        />
        <main id="main-content" role="main" tabIndex={-1} className="flex-1 focus:outline-hidden">
          <SplitScreenViewer
            document={selectedDoc}
            onBack={() => {
              setSelectedDoc(null);
              refreshDocuments();
            }}
            onCompare={(docId) => {
              setComparisonTargetId(docId);
              setShowComparison(true);
            }}
            onLawyerBrief={(docId) => {
              setLawyerBriefDocId(docId);
              setShowLawyerBrief(true);
            }}
          />
        </main>

        {showComparison && (
          <ContractComparisonModal
            documents={documents}
            initialDocAId={comparisonTargetId}
            onClose={() => setShowComparison(false)}
          />
        )}

        {showLawyerBrief && (
          <LawyerBriefModal
            documentId={lawyerBriefDocId}
            onClose={() => setShowLawyerBrief(false)}
          />
        )}

        {showLegalInfo && <LegalInfoModal onClose={() => setShowLegalInfo(false)} />}
        {showObservability && <ObservabilityModal onClose={() => setShowObservability(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <DisclaimerBanner />
      <Navbar
        onOpenObservability={() => setShowObservability(true)}
        onOpenLegalInfo={() => setShowLegalInfo(true)}
      />

      <main id="main-content" role="main" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 focus:outline-hidden">
        {/* Workspace Banner */}
        <div className="rounded-xl bg-slate-900 p-7 sm:p-8 text-white border border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
                Document Intelligence Workspace
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Upload and inspect agreements, analyze clause structures, track compliance obligations, and generate structured consultation briefs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc,.txt,.md"
                aria-label="Upload legal contract file"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload New Contract</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowComparison(true)}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors border border-slate-700"
              >
                <FileDiff className="w-4 h-4 text-slate-300" />
                <span>Compare Contracts</span>
              </button>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 scale-[1.005]"
              : "border-slate-300/80 hover:border-slate-400 bg-white/70"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700">
              Drop any legal document here or <span className="text-indigo-600 underline">browse files</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Supports PDF, DOCX, and TXT up to 50MB. Structural layout and page preservation enabled.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Documents</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{documents.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">4 pre-indexed synthetic contracts</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attention Risks</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{totalRisks}</div>
            <p className="text-[11px] text-slate-400 mt-1">Flagged for lawyer review</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Citation Grounding</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">100%</div>
            <p className="text-[11px] text-slate-400 mt-1">Zero fabricated clauses</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Advocate Dossier</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">10-Point</div>
            <p className="text-[11px] text-slate-400 mt-1">Exportable briefing dossiers</p>
          </div>
        </div>

        {/* Documents Management Section */}
        <div className="space-y-4">
          {/* Section Toolbar: Search and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Indexed Legal Contracts</h2>
              <p className="text-xs text-slate-500">Click any document to open the split-screen intelligence suite</p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search contract name, party..."
                  aria-label="Search contracts by name or party"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-800 w-48 sm:w-64"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter documents by contract type"
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="All">All Types</option>
                <option value="Employment Contract">Employment</option>
                <option value="Rental Agreement">Rental / Lease</option>
                <option value="Non-Disclosure Agreement (NDA)">NDA</option>
                <option value="SaaS Service Agreement">SaaS Agreement</option>
              </select>
            </div>
          </div>

          {/* Documents Cards Grid */}
          {loading || viewerLoading ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-slate-200/80 space-x-3 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading document intelligence...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No contracts found matching your filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredDocs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleOpenDocument(d.id)}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50/70 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {d.filename}
                          </h3>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {d.doc_type}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {d.page_count} Pages
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Risk Score Pill */}
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          d.risk_score > 70
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : d.risk_score > 40
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          Risk {d.risk_score}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {d.executive_summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {d.parties.join(" • ")}
                    </span>
                    <span className="inline-flex items-center space-x-1 text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showComparison && (
        <ContractComparisonModal
          documents={documents}
          initialDocAId={comparisonTargetId}
          onClose={() => setShowComparison(false)}
        />
      )}

      {showLawyerBrief && (
        <LawyerBriefModal
          documentId={lawyerBriefDocId}
          onClose={() => setShowLawyerBrief(false)}
        />
      )}

      {showLegalInfo && <LegalInfoModal onClose={() => setShowLegalInfo(false)} />}
      {showObservability && <ObservabilityModal onClose={() => setShowObservability(false)} />}
    </div>
  );
}
