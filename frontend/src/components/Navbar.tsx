"use client";
import React from "react";
import Link from "next/link";
import { Scale, BookOpen, Activity, ChevronRight } from "lucide-react";

interface NavbarProps {
  onOpenObservability?: () => void;
  onOpenLegalInfo?: () => void;
}

export default function Navbar({ onOpenObservability, onOpenLegalInfo }: NavbarProps) {
  return (
    <header role="banner" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" aria-label="NyayaLens Home" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
              <Scale className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">NyayaLens</span>
              <p className="text-[11px] text-slate-500 hidden sm:block font-sans -mt-0.5">Legal Document Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav role="navigation" aria-label="Main Navigation" className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
          <Link href="/#workflow" className="hover:text-slate-900 transition-colors py-1">
            How It Works
          </Link>
          <Link href="/#features" className="hover:text-slate-900 transition-colors py-1">
            Core Features
          </Link>
          <button
            onClick={onOpenLegalInfo}
            aria-label="Open India Law Codex"
            className="hover:text-slate-900 transition-colors flex items-center space-x-1.5 py-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>India Law Codex</span>
          </button>
          <button
            onClick={onOpenObservability}
            aria-label="Open Trust & Verification Telemetry"
            className="hover:text-slate-900 transition-colors flex items-center space-x-1.5 py-1"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Trust & Verification</span>
          </button>
        </nav>

        {/* Action CTA */}
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            aria-label="Open Document Workspace"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <span>Open Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
