"use client";
import React, { useState, useRef } from "react";
import {
  DocumentDetail, Clause, RiskFinding, ObligationItem,
  TimelineEvent, Citation, askDocument, updateObligationStatus
} from "@/lib/api";
import {
  FileText, ShieldAlert, CheckSquare, Clock, MessageSquare,
  Search, ArrowLeft, ArrowRight, ExternalLink, AlignLeft,
  AlertTriangle, CheckCircle2, ChevronRight, Languages,
  Scale, Briefcase, FileDiff, Download, RefreshCw, Send,
  HelpCircle, Info, Bookmark, Compass, Zap, Share2
} from "lucide-react";
import ContractNetworkGraph from "@/components/ContractNetworkGraph";

interface SplitScreenViewerProps {
  document: DocumentDetail;
  onBack: () => void;
  onCompare: (docId: string) => void;
  onLawyerBrief: (docId: string) => void;
}

export default function SplitScreenViewer({
  document: initialDoc,
  onBack,
  onCompare,
  onLawyerBrief,
}: SplitScreenViewerProps) {
  const [doc, setDoc] = useState<DocumentDetail>(initialDoc);
  const [activeTab, setActiveTab] = useState<"summary" | "clauses" | "risks" | "obligations" | "timeline" | "chat" | "graph">("summary");
  
  // Left Panel Page Navigation & Search
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [docSearch, setDocSearch] = useState<string>("");
  const [highlightedText, setHighlightedText] = useState<string>("");
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Summary Language Toggle: "english" | "hinglish"
  const [summaryLang, setSummaryLang] = useState<"english" | "hinglish">("english");

  // Clause filter
  const [clauseFilter, setClauseFilter] = useState<string>("all");

  // Ask AI state
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLang, setChatLang] = useState<"english" | "hindi" | "hinglish">("english");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    citations?: Citation[];
    followups?: string[];
    isGrounded?: boolean;
  }>>([
    {
      role: "assistant",
      content: `Hello! I have analyzed **${doc.filename}**. Every answer I provide is strictly grounded in this document with verifiable page citations. What would you like to understand?`,
      isGrounded: true,
      followups: [
        "Can I terminate this agreement?",
        "What are my key obligations?",
        "What happens if I miss the payment deadline?",
        "Is there an automatic renewal?"
      ]
    }
  ]);

  // Jump to page and trigger highlight
  const jumpToPage = (pageNum: number, snippetToHighlight?: string) => {
    setCurrentPage(pageNum);
    if (snippetToHighlight) {
      setHighlightedText(snippetToHighlight.trim().slice(0, 100));
    }
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTop = 0;
    }
  };

  // Obligation checkbox toggle
  const toggleObligation = async (obId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    try {
      const updated = await updateObligationStatus(doc.id, obId, nextStatus);
      setDoc(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Submit query in Ask AI
  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || chatInput;
    if (!q.trim() || chatLoading) return;

    const userMsg = { role: "user" as const, content: q };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await askDocument(doc.id, q, chatLang);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          followups: res.suggested_followups,
          isGrounded: res.is_grounded,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an issue verifying the document citations. Please try rephrasing.",
          isGrounded: false,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const currentPageData = doc.pages_content.find((p) => p.page_number === currentPage) || doc.pages_content[0];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-slate-100 overflow-hidden font-sans">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-slate-200/80 px-5 py-3 flex items-center justify-between shadow-2xs z-10 flex-shrink-0">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/80"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {doc.filename}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {doc.doc_type}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {doc.parties.join(" • ")} | Jurisdiction: {doc.jurisdiction}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onCompare(doc.id)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
            aria-label="Compare Contract with other documents"
          >
            <FileDiff className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span className="hidden sm:inline">Compare Contract</span>
          </button>
          <button
            onClick={() => onLawyerBrief(doc.id)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
            aria-label="Prepare structured lawyer brief"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>Prepare Lawyer Brief</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Original Document Viewer */}
        <section aria-label="Original Document Viewer" className="w-1/2 flex flex-col border-r border-slate-200/80 bg-[#F1F5F9]">
          {/* Document Viewer Toolbar */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600">Original Contract</span>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <span className="text-slate-500 font-mono">Page {currentPage} of {doc.page_count}</span>
            </div>

            {/* Page navigation buttons */}
            <div className="flex items-center space-x-1.5" role="navigation" aria-label="Pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous Page"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(doc.page_count, 8) }).map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    aria-label={`Go to page ${idx + 1}`}
                    aria-current={currentPage === idx + 1 ? "page" : undefined}
                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === idx + 1
                        ? "bg-slate-950 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage >= doc.page_count}
                onClick={() => setCurrentPage((p) => Math.min(doc.page_count, p + 1))}
                aria-label="Next Page"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Search bar inside Document */}
          <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-200 flex items-center space-x-2 flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search words in contract..."
              aria-label="Search words in contract"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-hidden focus:ring-0 text-slate-800 placeholder-slate-400 font-medium"
            />
            {docSearch && (
              <button onClick={() => setDocSearch("")} aria-label="Clear search" className="text-xs text-slate-400 hover:text-slate-600">
                Clear
              </button>
            )}
          </div>

          {/* Document Content Canvas */}
          <div ref={pageContainerRef} className="flex-1 p-6 overflow-y-auto bg-slate-200/50">
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 min-h-full font-serif text-slate-800 text-sm leading-relaxed whitespace-pre-wrap selection:bg-amber-200">
              <div className="border-b border-slate-100 pb-3 mb-6 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>NYAYALENS VERIFIED ARCHIVE</span>
                <span>PAGE {currentPage}</span>
              </div>

              {/* Render Page Paragraphs with Highlight Logic */}
              {currentPageData?.text.split("\n\n").map((paragraph, pIdx) => {
                const isHighlightTarget = highlightedText && paragraph.toLowerCase().includes(highlightedText.toLowerCase().slice(0, 40));
                const matchesSearch = docSearch && paragraph.toLowerCase().includes(docSearch.toLowerCase());

                return (
                  <div
                    key={pIdx}
                    className={`mb-4 transition-all duration-300 ${
                      isHighlightTarget
                        ? "citation-highlight bg-amber-50 p-2.5 rounded-lg"
                        : matchesSearch
                        ? "bg-yellow-100/80 p-1.5 rounded-md"
                        : ""
                    }`}
                  >
                    {paragraph}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: AI Document Intelligence Suite */}
        <section aria-label="AI Document Intelligence Suite" className="w-1/2 flex flex-col bg-white">
          {/* Document Intelligence Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 flex-shrink-0 overflow-x-auto gap-1" role="tablist" aria-label="Document Intelligence Navigation">
            {[
              { id: "summary", label: "Summary", icon: AlignLeft, color: "text-slate-600" },
              { id: "clauses", label: `Clauses (${doc.clauses.length})`, icon: FileText, color: "text-slate-600" },
              { id: "risks", label: `Risk Radar (${doc.risks.length})`, icon: ShieldAlert, color: "text-slate-600" },
              { id: "obligations", label: `Obligations (${doc.obligations.length})`, icon: CheckSquare, color: "text-slate-600" },
              { id: "timeline", label: "Timeline", icon: Clock, color: "text-slate-600" },
              { id: "graph", label: "Visual Graph", icon: Share2, color: "text-slate-600" },
              { id: "chat", label: "Document Q&A", icon: MessageSquare, color: "text-slate-600" },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 border-t-2 border-slate-900 font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Summary */}
          {activeTab === "summary" && (
            <div id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Language Switcher for Summary */}
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50/80 to-purple-50/50 border border-indigo-100/80 p-3 rounded-2xl">
                <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-950">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <span>Summary Language Mode:</span>
                </div>
                <div className="flex rounded-xl bg-white p-0.5 border border-indigo-200/80 shadow-2xs">
                  <button
                    onClick={() => setSummaryLang("english")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      summaryLang === "english" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Plain English
                  </button>
                  <button
                    onClick={() => setSummaryLang("hinglish")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      summaryLang === "hinglish" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Hinglish (हिंदी + Eng)
                  </button>
                </div>
              </div>

              {/* Executive Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Summary</h3>
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evidence-Grounded</span>
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-sans">
                  {summaryLang === "english" ? doc.executive_summary : doc.hinglish_summary}
                </p>
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-600 mb-1">Plain Language Takeaway:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {summaryLang === "english" ? doc.plain_language_summary : doc.hinglish_summary}
                  </p>
                </div>
              </div>

              {/* Risk Profile & Core Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Risk Assessment</div>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-extrabold ${
                      doc.risk_score > 70 ? "text-rose-600" : doc.risk_score > 40 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {doc.risk_score}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        doc.risk_score > 70 ? "bg-rose-500" : doc.risk_score > 40 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${doc.risk_score}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Detected Provisions</div>
                  <div className="text-3xl font-extrabold text-slate-900">{doc.clauses.length}</div>
                  <div className="text-xs text-slate-500 mt-3 flex items-center space-x-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{doc.obligations.length} Actionable Checklist Items</span>
                  </div>
                </div>
              </div>

              {/* Key Metadata Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contract Metadata</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-slate-400 font-medium">Effective Date</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{doc.effective_date || "Upon execution"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Governing Law</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{doc.governing_law || "Laws of India"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Jurisdiction & Forum</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{doc.jurisdiction}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Dispute Mechanism</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{doc.dispute_mechanism || "Arbitration"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Tab 2: Clause Intelligence */}
          {activeTab === "clauses" && (
            <div id="panel-clauses" role="tabpanel" aria-labelledby="tab-clauses" className="flex-1 flex flex-col overflow-hidden">
              {/* Filter Pills */}
              <div className="p-3 border-b border-slate-200 bg-slate-50/90 flex items-center space-x-2 overflow-x-auto flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
                {["all", "termination", "indemnification", "non_compete", "payment_terms", "intellectual_property", "confidentiality"].map((cType) => (
                  <button
                    key={cType}
                    onClick={() => setClauseFilter(cType)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      clauseFilter === cType
                        ? "bg-slate-950 text-white shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {cType === "all" ? "All Clauses" : cType.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Clause Cards List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {doc.clauses
                  .filter((c) => clauseFilter === "all" || c.clause_type === clauseFilter)
                  .map((clause) => (
                    <div
                      key={clause.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900">{clause.title}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              clause.risk_level === "Critical"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : clause.risk_level === "High Attention"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {clause.risk_level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Source: Page {clause.source.page} {clause.source.section ? `• ${clause.source.section}` : ""}
                          </p>
                        </div>

                        <button
                          onClick={() => jumpToPage(clause.source.page, clause.source.snippet)}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-semibold transition-colors"
                        >
                          <span>Jump to Page {clause.source.page}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Plain Language Explanation */}
                      <div className="bg-slate-50/80 rounded-xl p-3.5 text-xs space-y-1.5 border border-slate-100">
                        <div className="text-slate-700 font-semibold">Plain English:</div>
                        <p className="text-slate-800 leading-relaxed">{clause.plain_english}</p>
                        {clause.hinglish && (
                          <p className="text-indigo-950 font-medium pt-1.5 border-t border-slate-200/60">
                            <span className="text-slate-400 font-normal">Hinglish: </span>
                            {clause.hinglish}
                          </p>
                        )}
                      </div>

                      {/* Why it Matters */}
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-slate-700">Why It Matters:</span>
                        <p className="text-slate-600 leading-relaxed">{clause.why_it_matters}</p>
                      </div>

                      {/* Obligations */}
                      {(clause.user_obligation || clause.counterparty_obligation) && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                          {clause.user_obligation && (
                            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                              <span className="font-semibold text-amber-900">Your Obligation:</span>
                              <p className="text-slate-700 mt-0.5">{clause.user_obligation}</p>
                            </div>
                          )}
                          {clause.counterparty_obligation && (
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-semibold text-slate-700">Counterparty Obligation:</span>
                              <p className="text-slate-600 mt-0.5">{clause.counterparty_obligation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tab 3: Risk Radar */}
          {activeTab === "risks" && (
            <div id="panel-risks" role="tabpanel" aria-labelledby="tab-risks" className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>
                    Findings classified into explainable severity tiers with suggested counsel questions.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("graph")}
                  className="flex-shrink-0 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-colors shadow-2xs ml-3"
                >
                  <Share2 className="w-3 h-3 text-slate-300" />
                  <span>Open Animated Graph</span>
                </button>
              </div>

              {doc.risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`rounded-2xl border p-5 shadow-xs space-y-3.5 bg-white transition-all ${
                    risk.severity === "Critical"
                      ? "border-rose-300 shadow-rose-50"
                      : risk.severity === "High Attention"
                      ? "border-amber-300 shadow-amber-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2 h-2 rounded-full ${
                        risk.severity === "Critical" ? "bg-rose-500" : risk.severity === "High Attention" ? "bg-amber-500" : "bg-blue-500"
                      }`} />
                      <h4 className="text-sm font-bold text-slate-900">{risk.title}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      risk.severity === "Critical"
                        ? "bg-rose-100 text-rose-800"
                        : risk.severity === "High Attention"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    }`}>
                      {risk.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed">{risk.detected_issue}</p>

                  <div className="bg-slate-50 rounded-xl p-3.5 text-xs space-y-1.5 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-700">Why It Matters: </span>
                      <span className="text-slate-600">{risk.why_it_matters}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Potential User Impact: </span>
                      <span className="text-slate-600">{risk.potential_user_impact}</span>
                    </div>
                  </div>

                  {/* Suggested Question for Lawyer */}
                  <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/60 border border-indigo-100 p-3.5 rounded-xl flex items-center justify-between">
                    <div className="text-xs">
                      <span className="font-semibold text-indigo-950">Question for Lawyer: </span>
                      <p className="text-indigo-800 italic mt-0.5">"{risk.suggested_lawyer_question}"</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("chat");
                        handleSendMessage(risk.suggested_lawyer_question);
                      }}
                      className="ml-3 px-3 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-slate-900 transition-colors whitespace-nowrap shadow-2xs"
                    >
                      Ask in Chat
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Source: Page {risk.page_number}</span>
                    <button
                      onClick={() => jumpToPage(risk.page_number, risk.source_text)}
                      aria-label={`Highlight source clause on page ${risk.page_number}`}
                      className="text-indigo-600 hover:underline font-semibold inline-flex items-center space-x-1"
                    >
                      <span>Highlight Source Clause</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Obligations Tracker */}
          {activeTab === "obligations" && (
            <div id="panel-obligations" role="tabpanel" aria-labelledby="tab-obligations" className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">
                  {doc.obligations.filter((o) => o.status === "Completed").length} of {doc.obligations.length} obligations completed
                </span>
                <span className="text-xs font-bold text-emerald-600">Actionable Checklist</span>
              </div>

              {doc.obligations.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4.5 transition-all ${
                    item.status === "Completed"
                      ? "bg-emerald-50/40 border-emerald-200 opacity-75"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <button
                      onClick={() => toggleObligation(item.id, item.status)}
                      aria-label={`Mark obligation "${item.task}" as ${item.status === "Completed" ? "pending" : "completed"}`}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                    >
                      {item.status === "Completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-indigo-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-slate-900 ${item.status === "Completed" ? "line-through text-slate-400" : ""}`}>
                          {item.task}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.responsible_party}
                        </span>
                      </div>

                      <div className="text-slate-500 flex items-center space-x-2 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <span>Deadline: <strong className="text-slate-800">{item.deadline}</strong></span>
                      </div>

                      {item.consequence_of_breach && (
                        <p className="text-amber-900 text-[11px] bg-amber-50/70 p-2.5 rounded-lg border border-amber-100 mt-1">
                          <span className="font-semibold">Consequence mentioned: </span>{item.consequence_of_breach}
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => jumpToPage(item.page_number)}
                          aria-label={`View obligation on page ${item.page_number}`}
                          className="text-[11px] text-indigo-600 hover:underline font-semibold"
                        >
                          View on Page {item.page_number}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Timeline */}
          {activeTab === "timeline" && (
            <div id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline" className="flex-1 p-6 overflow-y-auto">
              <div className="relative border-l-2 border-indigo-200/80 ml-4 pl-6 space-y-8">
                {doc.timeline.map((event) => (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-xs group-hover:scale-125 transition-transform" />
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                          {event.date_text}
                        </span>
                        <button
                          onClick={() => jumpToPage(event.page_number)}
                          className="text-[11px] text-indigo-600 hover:underline font-semibold"
                        >
                          Page {event.page_number}
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{event.event_type}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
                      <div className="text-[11px] text-slate-400 mt-2 font-mono">Source: {event.source_clause}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Ask Document (Evidence-Grounded RAG Chat) */}
          {activeTab === "chat" && (
            <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className="flex-1 flex flex-col overflow-hidden">
              {/* Language Selector Bar */}
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-600 flex-shrink-0">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Language Model:</span>
                <div className="flex rounded-lg bg-white p-0.5 border border-slate-200 text-xs shadow-2xs">
                  <button
                    onClick={() => setChatLang("english")}
                    className={`px-3 py-1 rounded-md transition-colors ${chatLang === "english" ? "bg-slate-950 text-white font-semibold" : "text-slate-600"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setChatLang("hinglish")}
                    className={`px-3 py-1 rounded-md transition-colors ${chatLang === "hinglish" ? "bg-slate-950 text-white font-semibold" : "text-slate-600"}`}
                  >
                    Hinglish
                  </button>
                  <button
                    onClick={() => setChatLang("hindi")}
                    className={`px-3 py-1 rounded-md transition-colors ${chatLang === "hindi" ? "bg-slate-950 text-white font-semibold" : "text-slate-600"}`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                {messages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed shadow-xs ${
                        msg.role === "user"
                          ? "bg-slate-950 text-white rounded-br-xs"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Evidence Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
                            <Scale className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                            <span>Verified Contractual Evidence ({msg.citations.length})</span>
                          </div>
                          {msg.citations.map((cit, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => jumpToPage(cit.page, cit.snippet)}
                              className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 hover:border-indigo-300 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center justify-between text-[11px] text-indigo-950 font-bold mb-1">
                                <span>Page {cit.page} {cit.section ? `• ${cit.section}` : ""}</span>
                                <span className="group-hover:underline text-[10px] text-indigo-600 flex items-center font-medium">
                                  Highlight in Viewer <ExternalLink className="w-2.5 h-2.5 ml-1" aria-hidden="true" />
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 italic font-serif line-clamp-2">
                                "{cit.snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Followup suggestion chips */}
                    {msg.followups && msg.followups.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[88%]">
                        {msg.followups.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleSendMessage(chip)}
                            className="text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 rounded-full px-3 py-1 font-medium transition-all shadow-2xs hover:border-indigo-200"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs w-fit">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" />
                    <span>Cross-verifying citations against document embeddings...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3.5 border-t border-slate-200 bg-white flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      chatLang === "hinglish"
                        ? "Puchhiye: 'Notice period kitna hai?'"
                        : "Ask about rights, termination, payment deadlines, liabilities..."
                    }
                    aria-label="Ask questions about this legal document"
                    className="flex-1 text-xs px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-slate-800 shadow-2xs font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    aria-label="Send question to document AI"
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white disabled:opacity-40 transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 7: Visual Intelligence Graph */}
          {activeTab === "graph" && (
            <div id="panel-graph" role="tabpanel" aria-labelledby="tab-graph" className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              <ContractNetworkGraph document={doc} onJumpToPage={jumpToPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
