"use client";
import React, { useState, useEffect } from "react";
import { DocumentMetadata, ComparisonResult, compareDocuments } from "@/lib/api";
import { FileDiff, X, RefreshCw, AlertCircle, ArrowRight, Check, Filter } from "lucide-react";

interface ContractComparisonModalProps {
  documents: DocumentMetadata[];
  initialDocAId?: string;
  onClose: () => void;
}

export default function ContractComparisonModal({
  documents,
  initialDocAId,
  onClose,
}: ContractComparisonModalProps) {
  const [docAId, setDocAId] = useState<string>(initialDocAId || (documents[0]?.id || ""));
  const [docBId, setDocBId] = useState<string>(
    documents.find((d) => d.id !== initialDocAId)?.id || (documents[1]?.id || documents[0]?.id || "")
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const runComparison = async (aId: string, bId: string) => {
    if (!aId || !bId || aId === bId) return;
    setLoading(true);
    try {
      const res = await compareDocuments(aId, bId);
      setComparison(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docAId && docBId && docAId !== docBId) {
      runComparison(docAId, docBId);
    }
  }, [docAId, docBId]);

  const categories = ["All", "Financial", "Obligations", "Termination", "Liability", "Privacy", "Dispute Resolution"];

  const filteredDiffs = comparison?.diffs.filter((d) =>
    categoryFilter === "All" ? true : d.category === categoryFilter
  ) || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-dialog-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300">
              <FileDiff className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="comparison-dialog-title" className="text-base font-bold">Contract Comparison Engine</h2>
              <p className="text-xs text-slate-300">Side-by-side redline & semantic change analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close contract comparison modal"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Document Selection Controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-1">
              <label htmlFor="select-doc-a" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Document A (Baseline)
              </label>
              <select
                id="select-doc-a"
                value={docAId}
                onChange={(e) => setDocAId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.doc_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5 text-slate-400">
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </div>

            <div className="flex-1">
              <label htmlFor="select-doc-b" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Document B (Revised / Comparison)
              </label>
              <select
                id="select-doc-b"
                value={docBId}
                onChange={(e) => setDocBId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.doc_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => runComparison(docAId, docBId)}
            disabled={loading || docAId === docBId}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center space-x-1.5 self-end"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Compare Now</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex items-center space-x-2 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Comparison Content Canvas */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Aligning clauses and running semantic diff analysis...</p>
            </div>
          )}

          {docAId === docBId && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800 text-sm">
              <AlertCircle className="w-6 h-6 mx-auto text-amber-600 mb-2" />
              <p className="font-semibold">Please select two distinct contracts to compare.</p>
            </div>
          )}

          {comparison && !loading && docAId !== docBId && (
            <>
              {/* Executive Summary of Changes */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Executive Difference Summary
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed">{comparison.summary_of_changes}</p>
                <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>Total Changes: <strong className="text-slate-800">{comparison.total_changes}</strong></span>
                  <span>Filtered Shown: <strong className="text-indigo-600">{filteredDiffs.length}</strong></span>
                </div>
              </div>

              {/* Diffs List */}
              <div className="space-y-4">
                {filteredDiffs.map((diff) => (
                  <div
                    key={diff.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            diff.diff_type === "Added"
                              ? "bg-emerald-100 text-emerald-800"
                              : diff.diff_type === "Removed"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {diff.diff_type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{diff.title}</h4>
                      </div>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {diff.category}
                      </span>
                    </div>

                    {/* Side by side original text blocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">
                          {comparison.doc_a_name}
                        </div>
                        <p className="text-slate-700 italic font-serif leading-relaxed">
                          {diff.doc_a_clause ? `"${diff.doc_a_clause}"` : "(Clause not present)"}
                        </p>
                      </div>

                      <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
                        <div className="font-semibold text-indigo-700 mb-1 uppercase tracking-wider text-[10px]">
                          {comparison.doc_b_name}
                        </div>
                        <p className="text-slate-800 italic font-serif leading-relaxed">
                          {diff.doc_b_clause ? `"${diff.doc_b_clause}"` : "(Clause deleted)"}
                        </p>
                      </div>
                    </div>

                    {/* Neutral Explanation */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded">
                        <span className="font-semibold text-slate-700">What Changed?</span>
                        <p className="text-slate-600 mt-0.5">{diff.what_changed}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded">
                        <span className="font-semibold text-slate-700">Who Does It Affect?</span>
                        <p className="text-slate-600 mt-0.5">{diff.who_is_affected}</p>
                      </div>
                      <div className="bg-amber-50/60 p-2.5 rounded border border-amber-100">
                        <span className="font-semibold text-amber-900">What to Review:</span>
                        <p className="text-slate-700 mt-0.5">{diff.what_to_review}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
