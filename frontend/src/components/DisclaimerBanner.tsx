"use client";
import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between no-print">
      <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-center text-center">
        <span className="font-semibold text-amber-950 flex items-center">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 mr-1.5" />
          Legal Notice:
        </span>
        <p className="text-amber-900">
          NyayaLens provides informational document analysis and preparation assistance, <strong>not legal advice</strong>. Consult a licensed advocate for binding legal counsel.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-800 hover:text-amber-950 p-1 rounded transition-colors flex-shrink-0"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
