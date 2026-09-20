"use client";
import React, { useState, useEffect } from "react";
import { LegalConcept, fetchLegalConcepts } from "@/lib/api";
import { BookOpen, Search, X, Scale, ExternalLink, RefreshCw, Info } from "lucide-react";

interface LegalInfoModalProps {
  onClose: () => void;
}

export default function LegalInfoModal({ onClose }: LegalInfoModalProps) {
  const [jurisdiction, setJurisdiction] = useState<string>("India");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [concepts, setConcepts] = useState<LegalConcept[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadConcepts = async (query?: string, juris: string = "India") => {
    setLoading(true);
    try {
      const data = await fetchLegalConcepts(query, juris);
      setConcepts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcepts(searchQuery, jurisdiction);
  }, [jurisdiction]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadConcepts(searchQuery, jurisdiction);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">India Law Codex & Legal Principles</h2>
              <p className="text-xs text-slate-300">Authoritative statutory frameworks and Supreme Court doctrines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Jurisdiction Selector */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <form onSubmit={handleSearch} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search legal doctrines (e.g., 'Indemnity', 'Non-compete Section 27', 'Force Majeure')..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500 text-slate-800"
            />
          </form>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Jurisdiction:</span>
            <div className="flex rounded-lg bg-white p-0.5 border border-slate-300 text-xs">
              {["India", "United States", "United Kingdom", "Global"].map((j) => (
                <button
                  key={j}
                  onClick={() => setJurisdiction(j)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    jurisdiction === j ? "bg-slate-900 text-white font-medium" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-2 text-[11px] text-indigo-900 flex items-center space-x-2 flex-shrink-0">
          <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span>
            General legal information cited directly from India Code and authoritative judicial precedents. Not a substitute for fact-specific legal counsel.
          </span>
        </div>

        {/* Concepts Content List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Searching legal codex...</p>
            </div>
          ) : concepts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No legal concepts found matching your search. Try "Indemnity" or "Non-compete".
            </div>
          ) : (
            concepts.map((concept, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900">{concept.term}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {concept.common_in.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700">Plain Meaning:</span>
                  <p className="text-slate-800 leading-relaxed">{concept.plain_meaning}</p>
                </div>

                <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-3 text-xs space-y-1">
                  <span className="font-semibold text-amber-900">Why It Matters to You:</span>
                  <p className="text-slate-700 leading-relaxed">{concept.why_it_matters}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700 flex items-center space-x-1">
                      <span>Statutory Framework</span>
                    </span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{concept.statutory_framework}</p>
                    {concept.india_code_reference && (
                      <p className="text-[11px] font-mono text-indigo-700 font-semibold mt-2">
                        Ref: {concept.india_code_reference}
                      </p>
                    )}
                  </div>

                  {concept.case_law_doctrine && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Supreme Court Doctrine</span>
                      <p className="text-slate-600 mt-1 leading-relaxed italic">{concept.case_law_doctrine}</p>
                    </div>
                  )}
                </div>

                {concept.sample_clause && (
                  <div className="text-[11px] bg-indigo-50/50 p-2.5 rounded border border-indigo-100">
                    <span className="font-semibold text-indigo-900">Sample Contract Clause: </span>
                    <span className="text-indigo-950 font-serif italic">{concept.sample_clause}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
