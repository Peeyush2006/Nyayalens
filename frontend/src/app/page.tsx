"use client";
import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import LegalInfoModal from "@/components/LegalInfoModal";
import ObservabilityModal from "@/components/ObservabilityModal";
import {
  Scale, Shield, FileText, CheckCircle2, ArrowRight,
  Search, Lock, Users, FileDiff, Briefcase, ChevronRight,
  BookOpen, Activity, AlertTriangle, HelpCircle, CheckSquare,
  Zap, Eye, Compass, ShieldCheck, ArrowUpRight, Share2
} from "lucide-react";
import ContractNetworkGraph from "@/components/ContractNetworkGraph";
import { DocumentDetail } from "@/lib/api";

export default function LandingPage() {
  const [showLegalInfo, setShowLegalInfo] = useState<boolean>(false);
  const [showObservability, setShowObservability] = useState<boolean>(false);

  // Interactive Hero Preview State
  const [activePreviewClause, setActivePreviewClause] = useState<"non-compete" | "indemnity" | "lock-in">("non-compete");

  const previewClauses = {
    "non-compete": {
      title: "Section 6.1: Non-Compete Restriction",
      text: "Employee covenants that for a period of twelve (12) months following cessation of employment, they shall not directly or indirectly engage in or consult with any competing enterprise software firm within India.",
      plain: "Prohibits working for or consulting with competitors for 1 year after exiting.",
      hinglish: "1 saal tak kisi competing company mein job ya consulting karne par rok lagata hai.",
      risk: "Critical Concern",
      riskColor: "text-rose-600 bg-rose-50 border-rose-200",
      lawyerQ: "Is this post-employment non-compete void under Section 27 of the Indian Contract Act?",
      page: "Page 4, Section 6.1"
    },
    "indemnity": {
      title: "Section 7.1: Broad Indemnification",
      text: "The Employee shall indemnify, defend, and hold harmless the Company against any third-party claims, liabilities, losses, damages, and legal costs arising from any breach.",
      plain: "Shifts legal defense costs and third-party lawsuit liabilities onto you.",
      hinglish: "Agar koi third-party lawsuit kare toh uske kharche aapko uthane pad sakte hain.",
      risk: "High Attention",
      riskColor: "text-amber-600 bg-amber-50 border-amber-200",
      lawyerQ: "Can we cap this indemnity to direct willful misconduct rather than open-ended losses?",
      page: "Page 7, Section 7.1"
    },
    "lock-in": {
      title: "Section 3.2: 12-Month Mandatory Lock-In",
      text: "If Employee resigns prior to twelve (12) months from Commencement, Employee shall pay INR 3,50,000 as liquidated damages for replacement and training costs.",
      plain: "Leaving before 1 year requires paying INR 3.5 Lakhs in exit penalties.",
      hinglish: "1 saal se pehle resign karne par 3.5 Lakh rupees penalty bharni pad sakti hai.",
      risk: "Critical Concern",
      riskColor: "text-rose-600 bg-rose-50 border-rose-200",
      lawyerQ: "Are liquidated damages enforceable under Section 74 without proving actual incurred loss?",
      page: "Page 2, Section 3.2"
    }
  };

  const workflowSteps = [
    {
      num: "01",
      title: "Upload Contract",
      desc: "Drag & drop PDF, DOCX, or scans. Structural parser preserves exact page layouts, line breaks, and sections."
    },
    {
      num: "02",
      title: "Executive Synthesis",
      desc: "Instant multi-level summary with 1-click toggle between Plain English and conversational Hinglish."
    },
    {
      num: "03",
      title: "Clause Intelligence",
      desc: "Detects 15+ clause categories and isolates obligations, counterparty duties, and potential concerns."
    },
    {
      num: "04",
      title: "Explainable Risk Radar",
      desc: "Non-dogmatic risk classification into 4 tiers with exact page snippets and targeted questions for counsel."
    },
    {
      num: "05",
      title: "Contract Redline Diff",
      desc: "Compare two contracts side-by-side. Highlights Added, Removed, and Modified provisions by category."
    },
    {
      num: "06",
      title: "Lawyer Prep Dossier",
      desc: "Generate 10-point structured briefing report ready for advocate consultation, exportable to PDF/Markdown."
    },
  ];

  const demoContracts = [
    {
      id: "doc-demo-employment",
      title: "Lead Architect Employment Contract",
      type: "Employment Agreement",
      pages: "10 Pages",
      risks: "Non-compete, 12M Lock-in, Indemnity",
      desc: "Comprehensive tech employment agreement with IP assignment, 90-day probation, restrictive covenants, and liquidated damages."
    },
    {
      id: "doc-demo-rental",
      title: "Palm Springs Residential Lease",
      type: "Rental Agreement",
      pages: "6 Pages",
      risks: "6M Lock-In, Deposit Deductions",
      desc: "Standard residential tenancy agreement featuring mandatory lock-in period, 18% delayed payment interest, and inspection rights."
    },
    {
      id: "doc-demo-nda",
      title: "Nexis & BharatFintech Mutual NDA",
      type: "Non-Disclosure Agreement",
      pages: "3 Pages",
      risks: "SIAC/ICC Arbitration, Injunction",
      desc: "Bilateral trade secret protection agreement governing source code, API keys, and financial metrics with international arbitration."
    },
    {
      id: "doc-demo-saas",
      title: "CloudSphere Enterprise SaaS SLA",
      type: "SaaS Service Agreement",
      pages: "7 Pages",
      risks: "12-Month Liability Cap, Auto-Renewal",
      desc: "B2B cloud platform agreement with 99.9% uptime SLA, DPDP Act 2023 privacy obligations, and 60-day auto-renewal notice."
    }
  ];

  const sampleDocForGraph: DocumentDetail = {
    id: "doc-demo-employment",
    filename: "TechFlow_Lead_Architect_Employment_Agreement.pdf",
    file_type: "pdf",
    file_size: 142800,
    page_count: 10,
    uploaded_at: "2026-09-20",
    doc_type: "Employment Agreement",
    parties: ["TechFlow Innovations Pvt. Ltd.", "Vikramaditya Sharma"],
    jurisdiction: "Bengaluru, Karnataka, India",
    executive_summary: "Technology employment agreement containing restrictive covenants, 90-day notice, and 12-month lock-in period.",
    plain_language_summary: "Employment contract with restrictive covenants.",
    hinglish_summary: "Job agreement jisme non-compete aur lock-in clauses hain.",
    risk_score: 78,
    risk_breakdown: { "Critical": 2, "High Attention": 2, "Moderate": 1 },
    clauses: [
      {
        id: "c1",
        clause_type: "non_compete",
        title: "Section 6.1 Non-Compete",
        original_text: "12-month post-employment non-compete restriction",
        plain_english: "Bars working for competitors for 1 year post-exit.",
        hinglish: "1 saal tak competitor ke saath kaam par rok.",
        why_it_matters: "Severely limits job mobility in the software industry.",
        risk_level: "Critical",
        confidence: 0.95,
        source: { page: 4, section: "Section 6.1", snippet: "shall not directly or indirectly engage in competing software firm" }
      },
      {
        id: "c2",
        clause_type: "lock_in_period",
        title: "Section 3.2 Lock-In Penalty",
        original_text: "INR 3.5 Lakh liquidated damages penalty",
        plain_english: "Leaving before 1 year requires paying INR 3.5 Lakhs.",
        hinglish: "1 saal se pehle chhodne par penalty.",
        why_it_matters: "Financial penalty for leaving before 12 months.",
        risk_level: "Critical",
        confidence: 0.92,
        source: { page: 2, section: "Section 3.2", snippet: "Employee shall pay INR 3,50,000 as liquidated damages" }
      },
      {
        id: "c3",
        clause_type: "termination_notice",
        title: "Section 4.1 Notice Period",
        original_text: "90 days written notice required",
        plain_english: "Requires 90 days notice to resign.",
        hinglish: "90 din ka notice dena hoga.",
        why_it_matters: "Lengthy exit cycle.",
        risk_level: "High Attention",
        confidence: 0.94,
        source: { page: 5, section: "Section 4.1", snippet: "providing ninety (90) days prior written notice" }
      },
      {
        id: "c4",
        clause_type: "indemnification",
        title: "Section 7.1 Broad Indemnity",
        original_text: "Employee indemnifies company for third party claims",
        plain_english: "You pay legal costs if company is sued by third parties.",
        hinglish: "Third party lawsuit ke kharche aapko dene honge.",
        why_it_matters: "Uncapped legal liability.",
        risk_level: "High Attention",
        confidence: 0.89,
        source: { page: 7, section: "Section 7.1", snippet: "indemnify, defend, and hold harmless against third-party claims" }
      },
      {
        id: "c5",
        clause_type: "ip_assignment",
        title: "Section 5.1 IP Rights",
        original_text: "Work-for-hire assignment of all intellectual property",
        plain_english: "All code and designs created belong 100% to company.",
        hinglish: "Sara code aur design company ka hoga.",
        why_it_matters: "Protects employer proprietary rights.",
        risk_level: "Moderate",
        confidence: 0.91,
        source: { page: 3, section: "Section 5.1", snippet: "all inventions, copyrights, and code shall belong solely to Company" }
      },
    ],
    risks: [
      {
        id: "r1",
        title: "Section 27 Indian Contract Act Concern",
        severity: "Critical",
        detected_issue: "Post-employment non-compete clauses are void under Section 27 in India.",
        why_it_matters: "The clause cannot be enforced legally against you in Indian courts.",
        potential_user_impact: "May create fear of exit despite statutory unenforceability.",
        source_text: "shall not engage in or consult with any competing enterprise software firm",
        page_number: 4,
        suggested_lawyer_question: "Is this post-employment non-compete void under Section 27?"
      },
      {
        id: "r2",
        title: "Section 74 Liquidated Damages Penalty",
        severity: "Critical",
        detected_issue: "INR 3.5 Lakh penalty must prove actual damage under Section 74.",
        why_it_matters: "Employers cannot collect arbitrary penalties without demonstrating loss.",
        potential_user_impact: "Financial deduction upon early resignation.",
        source_text: "pay INR 3,50,000 as liquidated damages for replacement costs",
        page_number: 2,
        suggested_lawyer_question: "Can the company deduct this penalty without proving actual loss?"
      }
    ],
    obligations: [
      {
        id: "o1",
        task: "Provide 90 days written notice prior to exit",
        responsible_party: "Employee",
        deadline: "90 days",
        source_clause: "Section 4.1",
        page_number: 5,
        consequence_of_breach: "Forfeiture of unpaid dues and reliving letter delay",
        status: "Pending"
      }
    ],
    timeline: [
      {
        id: "t1",
        date_text: "Month 1-3",
        event_type: "Probation Evaluation",
        description: "Review of technical deliverables and confirmation of role",
        page_number: 1,
        source_clause: "Section 2.1"
      }
    ],
    pages_content: [
      { page_number: 1, text: "TechFlow Lead Architect Agreement", sections: ["Section 1"] }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <DisclaimerBanner />
      <Navbar
        onOpenObservability={() => setShowObservability(true)}
        onOpenLegalInfo={() => setShowLegalInfo(true)}
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight font-serif leading-[1.15]">
            Understand Legal Documents <br className="hidden sm:block" />
            <span className="text-indigo-950">Without the Complexity.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Understand your contracts, identify key obligations and risks, compare agreements, and prepare structured questions before consulting a lawyer.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Analyze a Document</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </Link>

            <Link
              href="#interactive-demo"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>View Interactive Demo</span>
            </Link>
          </div>

          {/* Clean Trust Row */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              <span>Exact Section & Page Citations</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              <span>Evidence-Grounded Explanations</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              <span>Assists, Does Not Replace Counsel</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Hero Preview Component */}
      <section id="interactive-demo" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Interactive Preview</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              See How Complex Clauses Are Simplified
            </h2>
            <p className="text-xs text-slate-500">
              Select a clause below to view original text alongside plain explanations and advocate questions.
            </p>
          </div>

          {/* Interactive Clause Selector Buttons */}
          <div className="flex justify-center space-x-2">
            {[
              { id: "non-compete", label: "Non-Compete Covenant" },
              { id: "indemnity", label: "Broad Indemnification" },
              { id: "lock-in", label: "12-Month Lock-In Penalty" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreviewClause(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activePreviewClause === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Live Interactive Preview Box */}
          <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800 text-white">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="font-mono uppercase text-[11px] text-slate-300">
                  {previewClauses[activePreviewClause].title}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">{previewClauses[activePreviewClause].page}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Left Column: Original Legal Clause */}
              <div className="p-6 sm:p-8 space-y-4 bg-slate-950/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Original Document Text</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-sm font-serif leading-relaxed text-slate-200 italic">
                  "{previewClauses[activePreviewClause].text}"
                </div>
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Grounded source citation with coordinate verification</span>
                </div>
              </div>

              {/* Right Column: Intelligence Analysis */}
              <div className="p-6 sm:p-8 space-y-4 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Structured Legal Breakdown</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${previewClauses[activePreviewClause].riskColor}`}>
                    {previewClauses[activePreviewClause].risk}
                  </span>
                </div>

                {/* Plain English */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Plain English:</span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                    {previewClauses[activePreviewClause].plain}
                  </p>
                </div>

                {/* Hinglish */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-indigo-300">Hinglish (हिंदी + English):</span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/50">
                    {previewClauses[activePreviewClause].hinglish}
                  </p>
                </div>

                {/* Question for Lawyer */}
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-400/20 text-xs">
                  <span className="font-semibold text-amber-300 flex items-center space-x-1 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Suggested Question for Advocate:</span>
                  </span>
                  <p className="text-slate-200 italic">
                    "{previewClauses[activePreviewClause].lawyerQ}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Visual Workflow */}
      <section id="workflow" className="py-20 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Cognitive Pipeline</span>
            <h2 className="text-3xl font-bold font-serif text-slate-900">
              From 20 Pages of Dense Text to a Clear Action Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              An intelligent, evidence-linked journey built to demystify contracts in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all duration-200 space-y-3.5 group relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-indigo-500/80 group-hover:text-indigo-600 transition-colors">
                    {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Legal Graph Showcase Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Visual Legal Topology</span>
            <h2 className="text-3xl font-bold font-serif text-slate-900">
              Interactive Clause & Risk Network Graph
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Contracts are living dependency systems. NyayaLens maps clauses into an interactive animated network graph showing connected risks, statutory boundaries, and obligations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto shadow-sm">
            <ContractNetworkGraph document={sampleDocForGraph} />
          </div>
        </div>
      </section>

      {/* Demo Contracts Section */}
      <section id="demo-contracts" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Zero-Setup Exploration</span>
              <h2 className="text-3xl font-bold font-serif text-slate-900">
                Pre-Loaded Realistic Contracts
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                Experience full clause intelligence, risk radar, and grounded Q&A immediately without needing to configure API keys or upload confidential files.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Launch Dashboard Hub</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {demoContracts.map((c, idx) => (
              <Link
                key={idx}
                href="/dashboard"
                className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg hover:border-indigo-400 hover:bg-white transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                      {c.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{c.pages}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{c.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                  <span>Open in Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Architectural Differentiators */}
      <section id="features" className="py-20 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Product Integrity</span>
            <h2 className="text-3xl font-bold font-serif text-slate-900">
              What Makes NyayaLens Fundamentally Different
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Not a chatbot wrapper. A serious legal-tech intelligence platform designed with anti-hallucination guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Evidence-Linked Answers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every answer references the exact document page and snippet. Clicking a citation highlights the source text directly in the original document viewer.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Explainable Risk Radar</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Non-dogmatic risk detection categorized into Critical, High Attention, Moderate, and Informational tiers with targeted questions for counsel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileDiff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Contract Comparison Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare Document A and B side-by-side. Highlights Added, Removed, and Modified terms across financial, termination, and liability categories.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Actionable Obligation Tracker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Converts dense clauses into an interactive checklist with responsible parties, deadlines, and consequences of breach.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Lawyer Preparation Mode</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates a 10-point briefing dossier for consultations: key issues, ambiguous terms, documents to bring, and suggested questions for counsel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero Hallucination Guard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If evidence cannot be verified in the document, NyayaLens explicitly states "I couldn't find this information" instead of guessing or fabricating clauses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-8">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-white font-serif">NyayaLens</span>
                <p className="text-[11px] text-slate-400">Understand the law. Understand your document. Know your next step.</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-slate-400 font-medium">
              <button onClick={() => setShowLegalInfo(true)} className="hover:text-white transition-colors">
                India Law Codex
              </button>
              <button onClick={() => setShowObservability(true)} className="hover:text-white transition-colors">
                AI Observability
              </button>
              <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                Workspace Hub
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
            <p>© 2026 NyayaLens. Built for legal document intelligence and advocate preparation.</p>
            <p>Provides legal information, not definitive legal advice.</p>
          </div>
        </div>
      </footer>

      {showLegalInfo && <LegalInfoModal onClose={() => setShowLegalInfo(false)} />}
      {showObservability && <ObservabilityModal onClose={() => setShowObservability(false)} />}
    </div>
  );
}
