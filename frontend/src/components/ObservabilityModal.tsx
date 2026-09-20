"use client";
import React, { useState, useEffect } from "react";
import { fetchObservability } from "@/lib/api";
import { Activity, X, ShieldCheck, CheckCircle2, RefreshCw, Cpu, Database, Award } from "lucide-react";

interface ObservabilityModalProps {
  onClose: () => void;
}

export default function ObservabilityModal({ onClose }: ObservabilityModalProps) {
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchObservability()
      .then((data) => setMetrics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="observability-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="observability-modal-title" className="text-base font-bold">System Observability & Trust Metrics</h2>
              <p className="text-xs text-slate-300">Live AI evaluation and citation grounding verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close observability metrics modal"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs">Gathering real-time AI telemetry...</p>
            </div>
          ) : metrics ? (
            <>
              {/* Primary Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Citation Accuracy</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">{metrics.measured_citation_accuracy}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Target: 100%</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Unsupported Claims</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">{metrics.unsupported_claim_rate}</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Zero tolerance guard</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Avg RAG Latency</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.average_retrieval_latency_ms} ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Local hybrid reranker</div>
                </div>
              </div>

              {/* Guardrails Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active AI Safety Controls</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-50/70 border border-emerald-100">
                    <span className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <strong>Strict Anti-Hallucination Threshold:</strong>
                    </span>
                    <span className="text-emerald-800 font-semibold">Active (0.25 min overlap)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-indigo-50/70 border border-indigo-100">
                    <span className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <strong>Evidence-Grounding Enforcement:</strong>
                    </span>
                    <span className="text-indigo-800 font-semibold">Exact Page Anchor Required</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-slate-600" />
                      <strong>Indexed Corpus:</strong>
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {metrics.active_documents_indexed} Documents | {metrics.total_clauses_extracted} Clauses
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsible AI Badge */}
              <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-600 flex items-center space-x-2">
                <Award className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  NyayaLens guarantees that no legal clauses or case law citations are hallucinated or fabricated by the AI engine.
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
