"use client";
import React, { useState, useMemo } from "react";
import { DocumentDetail, Clause, RiskFinding } from "@/lib/api";
import {
  Share2, ShieldAlert, FileText, CheckCircle2, AlertTriangle,
  ZoomIn, RefreshCw, Eye, ExternalLink, Info, Filter, Compass
} from "lucide-react";

interface ContractNetworkGraphProps {
  document: DocumentDetail;
  onJumpToPage?: (page: number, snippet: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  fullTitle: string;
  category: "center" | "hub" | "clause" | "risk";
  group: string;
  severity?: "Critical" | "High Attention" | "Moderate" | "Informational";
  x: number;
  y: number;
  radius: number;
  color: string;
  page?: number;
  plainText?: string;
  rawText?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  highlighted?: boolean;
}

export default function ContractNetworkGraph({ document, onJumpToPage }: ContractNetworkGraphProps) {
  const [activeView, setActiveView] = useState<"network" | "radar">("network");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Compute Network Graph Nodes and Edges
  const { nodes, edges } = useMemo(() => {
    const width = 640;
    const height = 440;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodeList: GraphNode[] = [];
    const edgeList: GraphEdge[] = [];

    // 1. Center Document Node
    const centerNode: GraphNode = {
      id: "doc-root",
      label: document.doc_type || "Contract",
      fullTitle: document.filename,
      category: "center",
      group: "root",
      x: centerX,
      y: centerY,
      radius: 26,
      color: "#0f172a", // slate-900
      plainText: document.executive_summary,
    };
    nodeList.push(centerNode);

    // 2. Define 4 Hub Categories
    const hubsConfig = [
      { id: "hub-restrictive", label: "Restrictive Terms", angle: -0.75 * Math.PI, color: "#e11d48", group: "restrictive" }, // top-left
      { id: "hub-financial", label: "Financial & Penalties", angle: -0.25 * Math.PI, color: "#d97706", group: "financial" }, // top-right
      { id: "hub-termination", label: "Notice & Exit", angle: 0.25 * Math.PI, color: "#2563eb", group: "termination" }, // bottom-right
      { id: "hub-governance", label: "Duties & Law", angle: 0.75 * Math.PI, color: "#059669", group: "governance" }, // bottom-left
    ];

    const hubDistance = 115;
    const hubMap = new Map<string, GraphNode>();

    hubsConfig.forEach((h) => {
      const hx = centerX + hubDistance * Math.cos(h.angle);
      const hy = centerY + hubDistance * Math.sin(h.angle);

      const hubNode: GraphNode = {
        id: h.id,
        label: h.label,
        fullTitle: h.label,
        category: "hub",
        group: h.group,
        x: hx,
        y: hy,
        radius: 18,
        color: h.color,
      };

      nodeList.push(hubNode);
      hubMap.set(h.group, hubNode);

      // Edge from Center to Hub
      edgeList.push({
        from: centerNode.id,
        to: hubNode.id,
        x1: centerNode.x,
        y1: centerNode.y,
        x2: hx,
        y2: hy,
        color: "#94a3b8",
      });
    });

    // 3. Distribute Clauses & Risks as Leaf Nodes around their respective hubs
    const leafDistance = 75;

    // Helper to categorize clause
    const getGroup = (cType: string) => {
      const t = cType.toLowerCase();
      if (t.includes("compete") || t.includes("confidential") || t.includes("indemn") || t.includes("ip") || t.includes("restrict")) return "restrictive";
      if (t.includes("payment") || t.includes("fee") || t.includes("financial") || t.includes("liquidated") || t.includes("rent")) return "financial";
      if (t.includes("terminat") || t.includes("notice") || t.includes("lock_in") || t.includes("renewal")) return "termination";
      return "governance";
    };

    // Group clauses
    const groupedItems: Record<string, { title: string; plain: string; raw: string; risk: any; page: number }[]> = {
      restrictive: [],
      financial: [],
      termination: [],
      governance: [],
    };

    document.clauses.forEach((cl) => {
      const g = getGroup(cl.clause_type);
      groupedItems[g].push({
        title: cl.title || cl.source?.section || cl.clause_type.replace(/_/g, " "),
        plain: cl.plain_english,
        raw: cl.original_text,
        risk: cl.risk_level,
        page: cl.source?.page || 1,
      });
    });

    // Also include risk items
    document.risks.forEach((r) => {
      const g = r.severity === "Critical" ? "restrictive" : "financial";
      if (groupedItems[g].length < 4) {
        groupedItems[g].push({
          title: r.title,
          plain: r.detected_issue || r.why_it_matters,
          raw: r.source_text || r.suggested_lawyer_question,
          risk: r.severity,
          page: r.page_number,
        });
      }
    });

    // Place leaf nodes radially around each hub
    Object.entries(groupedItems).forEach(([group, items]) => {
      const hub = hubMap.get(group);
      if (!hub) return;

      const baseAngle = hubsConfig.find((h) => h.group === group)?.angle || 0;
      const count = Math.min(items.length, 4);

      items.slice(0, count).forEach((item, idx) => {
        const spread = 0.55; // spread angle in radians
        const offset = (idx - (count - 1) / 2) * spread;
        const leafAngle = baseAngle + offset;

        const lx = hub.x + leafDistance * Math.cos(leafAngle);
        const ly = hub.y + leafDistance * Math.sin(leafAngle);

        let color = "#10b981"; // Low / Standard
        if (item.risk === "Critical") color = "#f43f5e";
        else if (item.risk === "High Attention" || item.risk === "High") color = "#f59e0b";
        else if (item.risk === "Moderate") color = "#3b82f6";

        const leafNode: GraphNode = {
          id: `leaf-${group}-${idx}`,
          label: item.title,
          fullTitle: item.title,
          category: "clause",
          group,
          severity: item.risk,
          x: lx,
          y: ly,
          radius: 12,
          color,
          page: item.page,
          plainText: item.plain,
          rawText: item.raw,
        };

        nodeList.push(leafNode);

        edgeList.push({
          from: hub.id,
          to: leafNode.id,
          x1: hub.x,
          y1: hub.y,
          x2: lx,
          y2: ly,
          color: hub.color,
        });
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [document]);

  // Compute Multi-Axis Radar Metrics
  const radarMetrics = useMemo(() => {
    // 5 dimensions: 0-100 scale
    const criticalCount = document.risks.filter((r) => r.severity === "Critical").length;
    const highCount = document.risks.filter((r) => r.severity === "High Attention").length;
    const obCount = document.obligations.length;

    const financialScore = Math.min(100, 35 + criticalCount * 25 + highCount * 10);
    const restrictiveScore = Math.min(100, 40 + document.clauses.filter((c) => c.clause_type.includes("compete") || c.clause_type.includes("indemn")).length * 30);
    const terminationScore = Math.min(100, 50 + (document.clauses.some((c) => c.clause_type.includes("lock_in")) ? 35 : 15));
    const complianceScore = Math.min(100, Math.max(30, obCount * 14));
    const disputeScore = Math.min(100, document.jurisdiction ? 65 : 40);

    const axes = [
      { name: "Financial Exposure", value: financialScore, angle: -0.5 * Math.PI },
      { name: "Restrictive Rigidity", value: restrictiveScore, angle: -0.1 * Math.PI },
      { name: "Termination Asymmetry", value: terminationScore, angle: 0.3 * Math.PI },
      { name: "Compliance Load", value: complianceScore, angle: 0.7 * Math.PI },
      { name: "Jurisdiction & Dispute", value: disputeScore, angle: 1.1 * Math.PI },
    ];

    const radarRadius = 110;
    const radarCenter = { x: 220, y: 150 };

    const points = axes.map((ax) => {
      const r = (ax.value / 100) * radarRadius;
      return {
        x: radarCenter.x + r * Math.cos(ax.angle),
        y: radarCenter.y + r * Math.sin(ax.angle),
        name: ax.name,
        value: ax.value,
        endX: radarCenter.x + radarRadius * Math.cos(ax.angle),
        endY: radarCenter.y + radarRadius * Math.sin(ax.angle),
      };
    });

    const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

    return { axes, points, polygonPath, radarRadius, radarCenter };
  }, [document]);

  // Filtered nodes
  const visibleNodes = nodes.filter((n) => {
    if (filterGroup === "all") return true;
    if (n.category === "center") return true;
    return n.group === filterGroup;
  });

  const visibleEdges = edges.filter((e) => {
    if (filterGroup === "all") return true;
    const targetNode = nodes.find((n) => n.id === e.to);
    return targetNode && (targetNode.group === filterGroup || targetNode.category === "center");
  });

  const activeNode = hoveredNode || selectedNode;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
      {/* Top Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-900">Contract Visual Intelligence Graph</span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveView("network")}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeView === "network" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Clause Network
          </button>
          <button
            onClick={() => setActiveView("radar")}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeView === "radar" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Risk Radar
          </button>
        </div>
      </div>

      {/* Network View Filter Bar */}
      {activeView === "network" && (
        <div className="bg-white px-4 py-1.5 border-b border-slate-100 flex items-center space-x-2 text-xs overflow-x-auto">
          <span className="text-slate-400 font-medium flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {[
            { id: "all", label: "All Clauses" },
            { id: "restrictive", label: "Restrictive" },
            { id: "financial", label: "Financial" },
            { id: "termination", label: "Notice & Exit" },
            { id: "governance", label: "Duties" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterGroup(f.id)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                filterGroup === f.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="relative bg-slate-950 p-2 overflow-hidden select-none min-h-[360px] flex items-center justify-center">
        {activeView === "network" ? (
          <svg viewBox="0 0 640 440" className="w-full h-auto max-h-[380px] drop-shadow-md">
            {/* Background Grid Dots */}
            <defs>
              <pattern id="graph-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#1e293b" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-grid)" />

            {/* Edges with Animated Flow */}
            {visibleEdges.map((edge, idx) => {
              const isConnectedToActive =
                activeNode && (activeNode.id === edge.from || activeNode.id === edge.to);

              return (
                <g key={idx}>
                  {/* Base link line */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={isConnectedToActive ? "#38bdf8" : edge.color}
                    strokeWidth={isConnectedToActive ? 2.5 : 1.2}
                    strokeOpacity={isConnectedToActive ? 0.9 : 0.4}
                  />

                  {/* Flowing particle dash overlay */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={isConnectedToActive ? "#ffffff" : edge.color}
                    strokeWidth={isConnectedToActive ? 2 : 1}
                    strokeDasharray="4 8"
                    className="animate-dash-flow"
                    strokeOpacity={isConnectedToActive ? 1 : 0.6}
                  />
                </g>
              );
            })}

            {/* Render Nodes */}
            {visibleNodes.map((node) => {
              const isHovered = hoveredNode?.id === node.id;
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    setSelectedNode(node);
                    if (node.page && onJumpToPage && node.rawText) {
                      onJumpToPage(node.page, node.rawText);
                    }
                  }}
                >
                  {/* Outer Pulsing Aura for High Risk nodes */}
                  {node.severity === "Critical" && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius + 6}
                      fill={node.color}
                      opacity="0.25"
                      className="animate-node-breathe"
                    />
                  )}

                  {/* Focus Ring on Hover */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius + 4}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}

                  {/* Core Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={node.color}
                    stroke="#ffffff"
                    strokeWidth={node.category === "center" ? 2.5 : 1.5}
                    strokeOpacity="0.9"
                  />

                  {/* Node Label Text */}
                  <text
                    x={node.x}
                    y={node.category === "center" ? node.y + 4 : node.y + node.radius + 12}
                    textAnchor="middle"
                    fill={node.category === "center" ? "#ffffff" : "#cbd5e1"}
                    fontSize={node.category === "center" ? "10px" : "9px"}
                    fontWeight={node.category === "center" ? "bold" : "normal"}
                    className="pointer-events-none select-none"
                  >
                    {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          /* Multi-Axis Radar Visualizer */
          <div className="w-full flex flex-col md:flex-row items-center justify-around py-4 text-white">
            <svg viewBox="0 0 440 300" className="w-full max-w-sm h-auto">
              {/* Concentric Grid Rings */}
              {[0.25, 0.5, 0.75, 1.0].map((level, lIdx) => (
                <circle
                  key={lIdx}
                  cx={radarMetrics.radarCenter.x}
                  cy={radarMetrics.radarCenter.y}
                  r={radarMetrics.radarRadius * level}
                  fill="none"
                  stroke="#334155"
                  strokeDasharray="2 4"
                  strokeWidth="1"
                />
              ))}

              {/* Radial Axis Lines */}
              {radarMetrics.points.map((p, idx) => (
                <g key={idx}>
                  <line
                    x1={radarMetrics.radarCenter.x}
                    y1={radarMetrics.radarCenter.y}
                    x2={p.endX}
                    y2={p.endY}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x={p.endX + (p.endX - radarMetrics.radarCenter.x) * 0.22}
                    y={p.endY + (p.endY - radarMetrics.radarCenter.y) * 0.22}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9px"
                    fontWeight="600"
                  >
                    {p.name}
                  </text>
                </g>
              ))}

              {/* Animated Radar Sweep Line */}
              <line
                x1={radarMetrics.radarCenter.x}
                y1={radarMetrics.radarCenter.y}
                x2={radarMetrics.radarCenter.x}
                y2={radarMetrics.radarCenter.y - radarMetrics.radarRadius}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                className="animate-radar-sweep"
              />

              {/* Filled Risk Polygon */}
              <path
                d={radarMetrics.polygonPath}
                fill="rgba(239, 68, 68, 0.25)"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Polygon Vertex Dots */}
              {radarMetrics.points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* Radar Score Panel */}
            <div className="p-4 space-y-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs w-full max-w-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Composite Risk Score</span>
                <span className="text-xl font-bold text-rose-400">{document.risk_score} / 100</span>
              </div>
              <div className="space-y-1.5">
                {radarMetrics.axes.map((ax, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">{ax.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ax.value > 70 ? "bg-rose-500" : ax.value > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${ax.value}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-400 w-6 text-right">{ax.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected / Hovered Node Inspector Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-xs flex items-center justify-between min-h-[44px]">
        {activeNode ? (
          <div className="flex items-center space-x-3 w-full justify-between">
            <div className="flex items-center space-x-2 truncate mr-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: activeNode.color }}
              />
              <span className="font-bold text-slate-900 truncate">{activeNode.fullTitle}</span>
              {activeNode.page && (
                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                  Page {activeNode.page}
                </span>
              )}
              {activeNode.plainText && (
                <span className="text-slate-600 hidden md:inline truncate text-[11px]">
                  — {activeNode.plainText}
                </span>
              )}
            </div>

            {activeNode.page && onJumpToPage && (
              <button
                onClick={() => onJumpToPage(activeNode.page!, activeNode.rawText || "")}
                className="flex-shrink-0 inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors"
              >
                <span>Jump to Page</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-[11px] flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Hover or click any node to inspect connected clause relationships and jump to source citations.</span>
          </div>
        )}
      </div>
    </div>
  );
}
