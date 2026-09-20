"use client";
import React, { useState, useEffect } from "react";
import { LawyerConsultationBrief, fetchLawyerBrief } from "@/lib/api";
import {
  Briefcase, X, Download, Printer, RefreshCw, CheckSquare,
  AlertTriangle, HelpCircle, FileText, Calendar, Edit3
} from "lucide-react";

interface LawyerBriefModalProps {
  documentId: string;
  onClose: () => void;
}

export default function LawyerBriefModal({ documentId, onClose }: LawyerBriefModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [brief, setBrief] = useState<LawyerConsultationBrief | null>(null);
  const [userNotes, setUserNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  const loadBrief = async (notes: string = "") => {
    setLoading(true);
    try {
      const data = await fetchLawyerBrief(documentId, notes);
      setBrief(data);
      setUserNotes(data.user_notes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      loadBrief();
    }
  }, [documentId]);

  const handleUpdateNotes = async () => {
    setSavingNotes(true);
    await loadBrief(userNotes);
    setSavingNotes(false);
  };

  const downloadMarkdown = () => {
    if (!brief) return;
    const md = [
      `# Prepare for Legal Consultation: Briefing Dossier`,
      `**Document**: ${brief.document_name} (${brief.document_type})`,
      `**Generated on**: ${brief.generated_at}`,
      `\n> **Notice**: ${brief.disclaimer}\n`,
      `## 1. Executive Summary\n${brief.executive_summary}\n`,
      `## 2. Key Issues Requiring Review\n${brief.key_issues.map((i) => `- ${i}`).join("\n")}\n`,
      `## 3. Important Clauses\n${brief.important_clauses.map((c) => `### ${c.title} (Page ${c.page}) - ${c.risk}\n*${c.summary}*\nWhy it matters: ${c.why_it_matters}`).join("\n\n")}\n`,
      `## 4. Key User Obligations\n${brief.user_obligations.map((o) => `- **${o.task}** (Deadline: ${o.deadline})\n  Consequence: ${o.consequence}`).join("\n")}\n`,
      `## 5. Suggested Questions to Ask Your Lawyer\n${brief.questions_to_ask_lawyer.map((q, idx) => `${idx + 1}. ${q}`).join("\n")}\n`,
      `## 6. Missing or Omitted Information\n${brief.missing_information.map((m) => `- ${m}`).join("\n")}\n`,
      `## 7. Ambiguous Provisions\n${brief.ambiguous_provisions.map((a) => `- ${a}`).join("\n")}\n`,
      `## 8. Critical Deadlines Timeline\n${brief.critical_deadlines.map((d) => `- **${d.milestone}** (${d.date_text}): ${d.description}`).join("\n")}\n`,
      `## 9. Documents to Bring to Consultation\n${brief.recommended_documents_to_bring.map((d) => `- [ ] ${d}`).join("\n")}\n`,
      `## 10. Your Personal Notes\n${brief.user_notes || "No user notes recorded."}`
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NyayaLens_Brief_${brief.document_name.replace(/\.[^/.]+$/, "")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lawyer-brief-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/30 flex items-center justify-center text-amber-300">
              <Briefcase className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="lawyer-brief-title" className="text-base font-bold">Prepare for Legal Consultation</h2>
              <p className="text-xs text-slate-300">Comprehensive structured briefing dossier for advocates</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              aria-label="Print dossier to PDF"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Print to PDF"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={downloadMarkdown}
              aria-label="Export briefing dossier as Markdown"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs"
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close lawyer brief modal"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50 print:bg-white print:p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Assembling structured lawyer briefing dossier...</p>
            </div>
          ) : brief ? (
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8 print:border-none print:shadow-none">
              {/* Cover Meta */}
              <div className="border-b border-slate-200 pb-5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                  <span>NYAYALENS CONSULTATION BRIEF</span>
                  <span>GENERATED: {brief.generated_at}</span>
                </div>
                <h1 className="text-2xl font-bold font-serif text-slate-900">{brief.document_name}</h1>
                <p className="text-xs text-indigo-700 font-semibold mt-1">Classification: {brief.document_type}</p>
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-900 mt-4 leading-relaxed">
                  <strong>Notice to Advocate & Client:</strong> {brief.disclaimer}
                </div>
              </div>

              {/* 1. Executive Summary */}
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 flex items-center space-x-2">
                  <span>1. Executive Summary</span>
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed">{brief.executive_summary}</p>
              </section>

              {/* 2. Key Issues */}
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 flex items-center space-x-2">
                  <span>2. Key Issues Requiring Counsel Review</span>
                </h2>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {brief.key_issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 3. Important Clauses */}
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                  3. Important Clauses & Potential Concerns
                </h2>
                <div className="space-y-2.5">
                  {brief.important_clauses.map((cl, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{cl.title} (Page {cl.page})</h4>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {cl.risk}
                        </span>
                      </div>
                      <p className="text-slate-700 italic font-serif leading-relaxed">"{cl.summary}"</p>
                      <p className="text-slate-600 font-sans pt-1">
                        <strong className="text-slate-700">Why it matters: </strong>{cl.why_it_matters}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. User Obligations */}
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                  4. Key Obligations Imposed on You
                </h2>
                <div className="space-y-2">
                  {brief.user_obligations.map((ob, idx) => (
                    <div key={idx} className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100 space-y-0.5">
                      <div className="font-semibold text-slate-800">{ob.task}</div>
                      <div className="text-slate-500 text-[11px]">
                        Deadline: <strong className="text-slate-700">{ob.deadline}</strong> | Consequence: {ob.consequence}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Questions to Ask Lawyer */}
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                  5. Suggested Questions to Ask Your Lawyer
                </h2>
                <ol className="space-y-2 text-xs text-slate-800 list-decimal list-inside leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 font-medium">
                  {brief.questions_to_ask_lawyer.map((q, idx) => (
                    <li key={idx} className="text-slate-800">
                      {q}
                    </li>
                  ))}
                </ol>
              </section>

              {/* 6 & 7: Missing Info & Ambiguities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <section className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                    6. Missing Information
                  </h2>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    {brief.missing_information.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                    7. Ambiguous Provisions
                  </h2>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    {brief.ambiguous_provisions.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* 8. Critical Deadlines Timeline */}
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                  8. Critical Deadlines Timeline
                </h2>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {brief.critical_deadlines.map((dl, idx) => (
                    <div key={idx} className="flex items-baseline space-x-2">
                      <span className="font-bold text-indigo-700 min-w-[120px]">{dl.date_text}:</span>
                      <span className="text-slate-800">{dl.milestone} - {dl.description}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 9. Documents to Bring */}
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                  9. Documents to Bring to Consultation
                </h2>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {brief.recommended_documents_to_bring.map((docItem, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{docItem}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 10. Personal Notes */}
              <section className="space-y-2 no-print">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    10. Your Personal Consultation Notes
                  </h2>
                  <span className="text-[11px] text-slate-400">Auto-saved to brief</span>
                </div>
                <textarea
                  rows={4}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Record your personal doubts, agreed commercial numbers, or lawyer answers during your discussion..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500 text-slate-800"
                />
                <button
                  onClick={handleUpdateNotes}
                  disabled={savingNotes}
                  className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  {savingNotes ? "Saving..." : "Save Notes to Brief"}
                </button>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
