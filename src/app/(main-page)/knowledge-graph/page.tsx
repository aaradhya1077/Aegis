"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconGraph,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconShieldCheck,
  IconHelmet,
  IconPick,
  IconSettings,
  IconFilter,
  IconInfoCircle,
  IconMicrophone,
  IconMicrophoneOff,
  IconCheck,
  IconAlertTriangle,
  IconWind,
  IconSparkles,
  IconLayersIntersect,
  IconLanguage,
  IconArrowsDiagonal,
  IconChevronRight,
  IconArrowUpRight,
  IconListCheck,
  IconCircleDot,
  IconEye,
  IconEyeOff,
  IconScale,
} from "@tabler/icons-react";
import { fetchRegulationGraph } from "@/lib/api";
import { toast } from "sonner";

// ── Role Configuration Object Architecture ───────────────────────────────────

export interface RoleGraphConfig {
  role: string;
  titleEn: string;
  titleHi: string;
  focalNodeTypes: string[];
  defaultFilter: string;
  viewMode: "graph" | "checklist";
  descriptionEn: string;
  descriptionHi: string;
  accentColor: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
}

export const ROLE_CONFIGS: Record<string, RoleGraphConfig> = {
  regulator: {
    role: "regulator",
    titleEn: "Enforcement & Violations Lens",
    titleHi: "प्रवर्तन एवं उल्लंघन परिप्रेक्ष्य",
    focalNodeTypes: ["act", "clause", "violation"],
    defaultFilter: "violation",
    viewMode: "graph",
    descriptionEn: "Focused on statutory enforcement, Section 22(1A) sanctions, and violation propagation.",
    descriptionHi: "सांविधिक प्रवर्तन, धारा 22(1A) प्रतिबंधों और उल्लंघन प्रसार पर केंद्रित।",
    accentColor: "#ef4444",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: IconShieldCheck,
  },
  mine_officer: {
    role: "mine_officer",
    titleEn: "Compliance & Filings Lens",
    titleHi: "अनुपालन एवं विवरणी परिप्रेक्ष्य",
    focalNodeTypes: ["filing_type", "clause", "mine", "circular"],
    defaultFilter: "filing_type",
    viewMode: "graph",
    descriptionEn: "Focused on statutory deadlines, annual returns, CAPA actions, and mine obligations.",
    descriptionHi: "सांविधिक समय-सीमा, वार्षिक विवरणी, और खदान दायित्वों पर केंद्रित।",
    accentColor: "#38bdf8",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    icon: IconHelmet,
  },
  frontline: {
    role: "frontline",
    titleEn: "Field Hazard & Shift Checklist Lens",
    titleHi: "क्षेत्रीय खतरा एवं शिफ्ट चेकलिस्ट परिप्रेक्ष्य",
    focalNodeTypes: ["hazard", "checklist", "circular"],
    defaultFilter: "all",
    viewMode: "checklist",
    descriptionEn: "Simplified voice-friendly checklist of active safety circulars, methane thresholds, and shift tasks.",
    descriptionHi: "सक्रिय सुरक्षा परिपत्रों, मीथेन सीमाओं और शिफ्ट कार्यों की सरलीकृत चेकलिस्ट।",
    accentColor: "#f59e0b",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: IconPick,
  },
  admin: {
    role: "admin",
    titleEn: "Omniscient Master Lens",
    titleHi: "सर्वव्यापी मुख्य परिप्रेक्ष्य",
    focalNodeTypes: ["act", "clause", "obligation", "filing_type", "mine", "circular", "violation"],
    defaultFilter: "all",
    viewMode: "graph",
    descriptionEn: "Full topological cross-statutory network spanning all DGMS circulars, mines, and compliance checks.",
    descriptionHi: "सभी डीजीएमएस परिपत्रों, खदानों और अनुपालन जांचों को कवर करने वाला संपूर्ण नेटवर्क।",
    accentColor: "#a855f7",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    icon: IconSettings,
  },
};

// ── Entity Styling, Sizing & Radial Orbital Zones ───────────────────────────

const ENTITY_CONFIG: Record<
  string,
  { color: string; size: number; labelEn: string; labelHi: string; zone: number }
> = {
  act: { color: "#8b5cf6", size: 24, labelEn: "Primary Act", labelHi: "मूल अधिनियम", zone: 1 },
  circular: { color: "#06b6d4", size: 19, labelEn: "DGMS Circular", labelHi: "डीजीएमएस परिपत्र", zone: 2 },
  obligation: { color: "#f97316", size: 18, labelEn: "Obligation Domain", labelHi: "दायित्व क्षेत्र", zone: 2 },
  clause: { color: "#10b981", size: 14, labelEn: "Regulation Clause", labelHi: "विनियम धारा", zone: 3 },
  mine: { color: "#f59e0b", size: 18, labelEn: "Colliery / Mine", labelHi: "कोयला खदान", zone: 4 },
  violation: { color: "#ef4444", size: 17, labelEn: "Violation / Sanction", labelHi: "उल्लंघन / प्रतिबंध", zone: 5 },
  filing_type: { color: "#3b82f6", size: 15, labelEn: "Statutory Filing", labelHi: "सांविधिक विवरणी", zone: 5 },
};

// Orbital zones radiating outward from center
interface ZoneSpec {
  index: number;
  labelEn: string;
  labelHi: string;
  rMin: number;
  rMax: number;
  targetR: number;
  stroke: string;
}

const ORBITAL_ZONES: ZoneSpec[] = [
  { index: 1, labelEn: "ZONE 1 • PRIMARY ACTS", labelHi: "जोन 1 • मूल अधिनियम", rMin: 0, rMax: 80, targetR: 50, stroke: "rgba(139, 92, 246, 0.2)" },
  { index: 2, labelEn: "ZONE 2 • CIRCULARS & OBLIGATIONS", labelHi: "जोन 2 • परिपत्र एवं दायित्व", rMin: 150, rMax: 230, targetR: 190, stroke: "rgba(6, 182, 212, 0.18)" },
  { index: 3, labelEn: "ZONE 3 • CLAUSES & REGULATIONS", labelHi: "जोन 3 • विनियम एवं धाराएं", rMin: 270, rMax: 350, targetR: 310, stroke: "rgba(16, 185, 129, 0.18)" },
  { index: 4, labelEn: "ZONE 4 • MONITORED COLLIERIES", labelHi: "जोन 4 • निगरानी खदानें", rMin: 390, rMax: 470, targetR: 430, stroke: "rgba(245, 158, 11, 0.18)" },
  { index: 5, labelEn: "ZONE 5 • VIOLATIONS & FILINGS", labelHi: "जोन 5 • उल्लंघन एवं विवरणी", rMin: 510, rMax: 590, targetR: 550, stroke: "rgba(239, 68, 68, 0.18)" },
];

function getZoneForType(type: string): ZoneSpec {
  const cfg = ENTITY_CONFIG[type];
  const zIdx = cfg ? cfg.zone : 3;
  return ORBITAL_ZONES.find((z) => z.index === zIdx) || ORBITAL_ZONES[2];
}

// ── Graph Data Types ─────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: string;
  metadata?: Record<string, any> | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  expanded?: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

// ── Frontline Shift Checklist Items Model ───────────────────────────────────

interface ShiftCheckItem {
  id: string;
  category: "atmospheric" | "strata" | "manpower" | "haulage";
  titleEn: string;
  titleHi: string;
  regulationEn: string;
  regulationHi: string;
  thresholdEn: string;
  thresholdHi: string;
  severity: "critical" | "high" | "medium";
  status: "pending" | "passed" | "hazard";
  notes?: string;
}

const INITIAL_FRONTLINE_TASKS: ShiftCheckItem[] = [
  {
    id: "shift-01",
    category: "atmospheric",
    titleEn: "Return Airway Methane (CH₄) Telemetry Verification",
    titleHi: "रिटर्न एयरवे मीथेन (CH₄) गैस सांद्रता जांच",
    regulationEn: "CMR 2017 Reg. 153",
    regulationHi: "कोयला खान विनियम 2017 नियम 153",
    thresholdEn: "CH₄ must not exceed 0.75% in general body; immediate electrical tripping at 1.25%",
    thresholdHi: "मीथेन 0.75% से अधिक न हो; 1.25% पर विद्युत आपूर्ति तुरंत बंद करें",
    severity: "critical",
    status: "passed",
  },
  {
    id: "shift-02",
    category: "atmospheric",
    titleEn: "Intake & Face Ventilation Velocity Check",
    titleHi: "कार्य स्थल पर मुख्य वायु प्रवाह दर जांच",
    regulationEn: "CMR 2017 Reg. 154",
    regulationHi: "कोयला खान विनियम 2017 नियम 154",
    thresholdEn: "Air velocity ≥ 1.5 m/s at active longwall / continuous miner face; CO < 50 ppm",
    thresholdHi: "सक्रिय फेस पर वायु वेग ≥ 1.5 मी/सेकंड; कार्बन मोनोऑक्साइड < 50 ppm",
    severity: "high",
    status: "pending",
  },
  {
    id: "shift-03",
    category: "strata",
    titleEn: "Roof Convergence Tell-Tale Dilation Monitoring",
    titleHi: "छत संसक्ति / टेल-टेल विस्थापन मापन",
    regulationEn: "CMR 2017 Reg. 123 & DGMS Tech Cir. 02/2024",
    regulationHi: "सीएमआर 2017 नियम 123 व डीजीएमएस परिपत्र 02/2024",
    thresholdEn: "Dilation must be < 10 mm. Warning beacon triggers at 8 mm convergence.",
    thresholdHi: "छत विस्थापन 10 मिमी से कम होना चाहिए। 8 मिमी पर चेतावनी जारी करें।",
    severity: "critical",
    status: "hazard",
    notes: "Tell-tale #4B indicated 11.2 mm dilation. Auxiliary resin bolting required.",
  },
  {
    id: "shift-04",
    category: "strata",
    titleEn: "Resin Roof Bolt Torque & Density Audit",
    titleHi: "रेज़िन रूफ बोल्ट कसाव एवं घनत्व परीक्षण",
    regulationEn: "Systematic Support Rule (SSR)",
    regulationHi: "व्यवस्थित सपोर्ट नियम (SSR)",
    thresholdEn: "Minimum 120 Nm torque; minimum 4 bolts per 1.2 m roadway advance",
    thresholdHi: "न्यूनतम 120 Nm टॉर्क; प्रत्येक 1.2 मीटर प्रगति पर न्यूनतम 4 बोल्ट",
    severity: "high",
    status: "passed",
  },
  {
    id: "shift-05",
    category: "manpower",
    titleEn: "Pre-Shift Statutory Roll Call & Sirdar Log Signing",
    titleHi: "शिफ्ट पूर्व सांविधिक हाजिरी एवं सरदार डायरी हस्ताक्षर",
    regulationEn: "CMR 2017 Reg. 29 & 30",
    regulationHi: "सीएमआर 2017 नियम 29 एवं 30",
    thresholdEn: "100% cap lamps, flame safety lamps & self-rescuers inspected before descent",
    thresholdHi: "उतरने से पहले 100% कैप लैम्प, फ्लेम लैम्प व सेल्फ-रेस्क्यूअर की जांच",
    severity: "critical",
    status: "passed",
  },
  {
    id: "shift-06",
    category: "haulage",
    titleEn: "Belt Conveyor Emergency Pull-Cord Trip Test",
    titleHi: "बेल्ट कन्वेयर आपातकालीन पुल-कॉर्ड ट्रिप परीक्षण",
    regulationEn: "CMR 2017 Reg. 106",
    regulationHi: "सीएमआर 2017 नियम 106",
    thresholdEn: "Emergency cord must instantly trip haulage motor from any roadway point",
    thresholdHi: "पुल-कॉर्ड खींचते ही मोटर तुरंत बंद होनी चाहिए",
    severity: "high",
    status: "pending",
  },
];

export default function KnowledgeGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);

  // Interactive controls
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>("regulator");
  const [selectedFilterType, setSelectedFilterType] = useState<string>("all");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [progressiveMode, setProgressiveMode] = useState(true);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [showOrbitRings, setShowOrbitRings] = useState(true);

  // Selection & Hover
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // View & Transform
  const [zoom, setZoom] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const animFrame = useRef<number | null>(null);

  // Frontline checklist states
  const [shiftTasks, setShiftTasks] = useState<ShiftCheckItem[]>(INITIAL_FRONTLINE_TASKS);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // ── Sync with Global Active Stakeholder Role from localStorage ─────────────
  useEffect(() => {
    const readUserRole = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role && ROLE_CONFIGS[parsed.role]) {
            setSelectedRoleKey(parsed.role);
            return;
          }
        }
      } catch {}
      setSelectedRoleKey("regulator");
    };

    readUserRole();
    const handler = () => readUserRole();
    window.addEventListener("aegis-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aegis-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const activeRoleConfig = ROLE_CONFIGS[selectedRoleKey] || ROLE_CONFIGS.regulator;

  // ── Fetch Regulation Graph Data ─────────────────────────────────────────────
  useEffect(() => {
    fetchRegulationGraph()
      .then((data) => {
        const centerX = 640;
        const centerY = 440;

        // Group nodes by type to compute initial layout angles
        const typeGroups: Record<string, Array<{ id: string; label: string; type: string; metadata?: any }>> = {};
        data.nodes.forEach((n) => {
          if (!typeGroups[n.type]) typeGroups[n.type] = [];
          typeGroups[n.type].push(n);
        });

        const initialNodes: GraphNode[] = [];
        const initialExpanded = new Set<string>();

        Object.entries(typeGroups).forEach(([type, group]) => {
          const zone = getZoneForType(type);
          const count = group.length;

          group.forEach((n, i) => {
            const angle = (2 * Math.PI * i) / Math.max(count, 1) + (Math.random() - 0.5) * 0.2;
            const r = zone.targetR + (Math.random() - 0.5) * 20;

            initialNodes.push({
              id: n.id,
              label: n.label,
              type: n.type,
              metadata: n.metadata,
              x: centerX + r * Math.cos(angle),
              y: centerY + r * Math.sin(angle),
              vx: 0,
              vy: 0,
            });

            // Root primary acts are expanded by default in progressive disclosure
            if (type === "act") {
              initialExpanded.add(n.id);
            }
          });
        });

        setAllNodes(initialNodes);
        setAllEdges(data.edges);
        setExpandedNodeIds(initialExpanded);
      })
      .catch((err) => {
        console.error("Failed to load regulation graph:", err);
        toast.error("Could not fetch regulatory knowledge graph. Offline fallback loaded.");
      });
  }, []);

  // ── Compute Node Visibility via Progressive Disclosure ──────────────────────
  const { visibleNodes, visibleEdges, visibleNodeIds } = useMemo(() => {
    if (!progressiveMode) {
      // Filter by type if not "all"
      const nodes = selectedFilterType === "all" ? allNodes : allNodes.filter((n) => n.type === selectedFilterType);
      const nodeIds = new Set(nodes.map((n) => n.id));
      const edges = allEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
      return { visibleNodes: nodes, visibleEdges: edges, visibleNodeIds: nodeIds };
    }

    // Progressive disclosure:
    // Root nodes (Acts) are always visible.
    // Non-root nodes are visible only if connected to an expanded node.
    const visibleIds = new Set<string>();

    allNodes.forEach((n) => {
      if (n.type === "act") {
        visibleIds.add(n.id);
      }
    });

    // Expand 1-hop children of expanded nodes
    allEdges.forEach((e) => {
      if (expandedNodeIds.has(e.source)) {
        visibleIds.add(e.target);
      }
      if (expandedNodeIds.has(e.target)) {
        visibleIds.add(e.source);
      }
    });

    let filtered = allNodes.filter((n) => visibleIds.has(n.id));
    if (selectedFilterType !== "all") {
      filtered = filtered.filter((n) => n.type === selectedFilterType);
    }

    const finalNodeIds = new Set(filtered.map((n) => n.id));
    const edges = allEdges.filter((e) => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));

    return { visibleNodes: filtered, visibleEdges: edges, visibleNodeIds: finalNodeIds };
  }, [allNodes, allEdges, progressiveMode, expandedNodeIds, selectedFilterType]);

  // ── Selected Node Neighborhood for Dimming ──────────────────────────────────
  const { neighborhoodNodeIds, neighborhoodEdgeIndices } = useMemo(() => {
    if (!selectedNodeId) return { neighborhoodNodeIds: null, neighborhoodEdgeIndices: null };

    const nodes = new Set<string>([selectedNodeId]);
    const edges = new Set<number>();

    visibleEdges.forEach((e, idx) => {
      if (e.source === selectedNodeId) {
        nodes.add(e.target);
        edges.add(idx);
      } else if (e.target === selectedNodeId) {
        nodes.add(e.source);
        edges.add(idx);
      }
    });

    return { neighborhoodNodeIds: nodes, neighborhoodEdgeIndices: edges };
  }, [selectedNodeId, visibleEdges]);

  // ── Physics Simulation Step ────────────────────────────────────────────────
  const stepSimulation = useCallback(() => {
    if (visibleNodes.length === 0) return;

    const centerX = 640;
    const centerY = 440;
    const count = visibleNodes.length;
    const nodeMap = new Map<string, GraphNode>();
    visibleNodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Orbital Zone Restoring Force
    visibleNodes.forEach((node) => {
      const zone = getZoneForType(node.type);
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const r = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

      // Pull toward target zone radius
      const radialDiff = zone.targetR - r;
      const forceK = r < zone.rMin || r > zone.rMax ? 0.04 : 0.008;
      node.vx += (dx / r) * radialDiff * forceK;
      node.vy += (dy / r) * radialDiff * forceK;
    });

    // 2. Coulomb Repulsion + Tangential Spacing
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const n1 = visibleNodes[i];
        const n2 = visibleNodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.max(Math.sqrt(distSq), 1);

        const sameZone = n1.type === n2.type;
        const repulsionStrength = sameZone ? 2400 : 1200;
        const force = repulsionStrength / (distSq + 100);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;

        // 3. ZERO-OVERLAP Hard Circle-Circle Collision Detection & Resolution
        const r1 = ENTITY_CONFIG[n1.type]?.size || 15;
        const r2 = ENTITY_CONFIG[n2.type]?.size || 15;
        const minDistance = r1 + r2 + 16; // Hard collision clearance margin

        if (dist < minDistance) {
          const overlap = minDistance - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Push apart immediately along normal
          n1.x -= nx * overlap * 0.5;
          n1.y -= ny * overlap * 0.5;
          n2.x += nx * overlap * 0.5;
          n2.y += ny * overlap * 0.5;

          // Rebound velocity damping
          n1.vx -= nx * overlap * 0.08;
          n1.vy -= ny * overlap * 0.08;
          n2.vx += nx * overlap * 0.08;
          n2.vy += ny * overlap * 0.08;
        }
      }
    }

    // 4. Hooke's Spring Edge Attraction (Link Distance increased to 220px)
    const restLength = 220;
    const springK = 0.003;
    visibleEdges.forEach((e) => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - restLength) * springK;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    });

    // 5. Integrate velocity with high damping for stability
    visibleNodes.forEach((n) => {
      n.vx *= 0.82;
      n.vy *= 0.82;
      n.x += n.vx;
      n.y += n.vy;
    });
  }, [visibleNodes, visibleEdges]);

  // Run initial settling simulation loop
  const simCount = useRef(0);
  useEffect(() => {
    let active = true;
    simCount.current = 0;

    const loop = () => {
      if (!active) return;
      stepSimulation();
      simCount.current++;
      if (simCount.current < 90) {
        animFrame.current = requestAnimationFrame(loop);
      }
    };

    animFrame.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [visibleNodes.length, progressiveMode, stepSimulation]);

  // ── HTML5 Canvas Rendering ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    const centerX = 640;
    const centerY = 440;

    // 1. Draw Concentric Orbital Radar Guide Rings
    if (showOrbitRings) {
      ORBITAL_ZONES.forEach((zone) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, zone.targetR, 0, 2 * Math.PI);
        ctx.strokeStyle = zone.stroke;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Zone label on top arc
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        const label = language === "hi" ? zone.labelHi : zone.labelEn;
        ctx.fillText(label, centerX, centerY - zone.targetR - 5);
      });

      // Center crosshair
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
      ctx.fill();
    }

    const nodeMap = new Map<string, GraphNode>();
    visibleNodes.forEach((n) => nodeMap.set(n.id, n));

    // 2. Draw Edges with Neighborhood Highlighting
    visibleEdges.forEach((e, idx) => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (!source || !target) return;

      const isNeighborhoodEdge = neighborhoodEdgeIndices ? neighborhoodEdgeIndices.has(idx) : false;
      const isDimmed = neighborhoodEdgeIndices !== null && !isNeighborhoodEdge;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (isDimmed) {
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 0.5;
      } else if (isNeighborhoodEdge) {
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.2;
      } else {
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 0.8;
      }

      ctx.stroke();

      // Draw relationship label along edge if highlighted or hovered
      if (isNeighborhoodEdge || hoveredNodeId === source.id || hoveredNodeId === target.id) {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = "rgba(14, 20, 29, 0.85)";
        ctx.fillRect(midX - 35, midY - 8, 70, 16);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(e.relationship.replace("_", " "), midX, midY);
      }
    });

    ctx.globalAlpha = 1;

    // 3. Draw Nodes with Branch Status & Glow
    visibleNodes.forEach((node) => {
      const cfg = ENTITY_CONFIG[node.type] || { color: "#888", size: 14 };
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isDimmed = neighborhoodNodeIds !== null && !neighborhoodNodeIds.has(node.id);
      const isExpanded = expandedNodeIds.has(node.id);

      const radius = isSelected ? cfg.size * 1.35 : isHovered ? cfg.size * 1.2 : cfg.size;

      // Opacity dimming for non-neighborhood nodes
      ctx.globalAlpha = isDimmed ? 0.12 : 1;

      // Glow halo for selected or hovered node
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI);
        ctx.fillStyle = `${cfg.color}35`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
        ctx.fillStyle = `${cfg.color}25`;
        ctx.fill();
      }

      // Base Circle Body
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? cfg.color : `${cfg.color}45`;
      ctx.fill();

      // Outer Stroke
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
      ctx.stroke();

      // Progressive disclosure branch indicator (draw a '+' or '-' ring for expandable nodes)
      if (progressiveMode) {
        const hasConnected = allEdges.some((e) => e.source === node.id || e.target === node.id);
        if (hasConnected) {
          ctx.beginPath();
          ctx.arc(node.x + radius * 0.7, node.y - radius * 0.7, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = isExpanded ? "#10b981" : "#64748b";
          ctx.fill();
          ctx.strokeStyle = "#0e141d";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Label Rendering
      if (radius >= 14 || isSelected || isHovered) {
        ctx.fillStyle = isSelected ? "#ffffff" : isHovered ? "#f1f5f9" : "#cbd5e1";
        ctx.font = `${isSelected ? "bold 11px" : "10px"} sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Truncate long labels
        const displayLabel = node.label.length > 24 ? node.label.slice(0, 22) + "…" : node.label;
        ctx.fillText(displayLabel, node.x, node.y + radius + 6);
      }
    });

    ctx.restore();
  }, [
    visibleNodes,
    visibleEdges,
    zoom,
    offset,
    selectedNodeId,
    hoveredNodeId,
    neighborhoodNodeIds,
    neighborhoodEdgeIndices,
    showOrbitRings,
    expandedNodeIds,
    progressiveMode,
    language,
  ]);

  // ── Mouse & Pan / Zoom Handlers ─────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / zoom;
    const my = (e.clientY - rect.top - offset.y) / zoom;

    const found = visibleNodes.find((n) => {
      const size = (ENTITY_CONFIG[n.type]?.size || 14) * 1.5;
      const dx = n.x - mx;
      const dy = n.y - my;
      return dx * dx + dy * dy < size * size;
    });

    setHoveredNodeId(found ? found.id : null);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Click on Node -> Branch Expand/Collapse & Neighborhood Selection
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / zoom;
    const my = (e.clientY - rect.top - offset.y) / zoom;

    const clicked = visibleNodes.find((n) => {
      const size = (ENTITY_CONFIG[n.type]?.size || 14) * 1.8;
      const dx = n.x - mx;
      const dy = n.y - my;
      return dx * dx + dy * dy < size * size;
    });

    if (clicked) {
      setSelectedNodeId(clicked.id);

      // Progressive disclosure branch expansion toggle
      if (progressiveMode) {
        setExpandedNodeIds((prev) => {
          const next = new Set(prev);
          if (next.has(clicked.id)) {
            next.delete(clicked.id);
            toast.info(`Collapsed branch for ${clicked.label.slice(0, 24)}`);
          } else {
            next.add(clicked.id);
            toast.success(`Expanded 1-hop connections for ${clicked.label.slice(0, 24)}`);
          }
          return next;
        });
      }
    } else {
      // Click empty canvas -> Clear selection
      setSelectedNodeId(null);
    }
  };

  // Center on node helper
  const handleFocusNode = (nodeId: string) => {
    const target = allNodes.find((n) => n.id === nodeId);
    if (!target || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const targetOffsetX = rect.width / 2 - target.x * zoom;
    const targetOffsetY = rect.height / 2 - target.y * zoom;
    setOffset({ x: targetOffsetX, y: targetOffsetY });
    setSelectedNodeId(nodeId);
    toast.info(`Centered viewport on ${target.label}`);
  };

  // ── Frontline Voice Dictation Integration ───────────────────────────────────
  const toggleFrontlineVoice = () => {
    if (isVoiceRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsVoiceRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsVoiceRecording(true);
        toast.info(
          language === "hi"
            ? "माइक्रोफ़ोन सक्रिय है। अपनी शिफ्ट जांच टिप्पणी बोलें..."
            : "Microphone active. Dictate your frontline shift observations..."
        );
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setVoiceTranscript((prev) => (prev ? `${prev} • ${transcript}` : transcript));
          toast.success(`Voice note: "${transcript.substring(0, 40)}..."`);

          // Neuro-symbolic auto hazard tagging
          const lower = transcript.toLowerCase();
          if (
            lower.includes("methane") ||
            lower.includes("gas") ||
            lower.includes("ch4") ||
            lower.includes("गैस")
          ) {
            setShiftTasks((prev) =>
              prev.map((t) =>
                t.id === "shift-01" ? { ...t, status: "hazard", notes: `Flagged via voice: "${transcript}"` } : t
              )
            );
            toast.error("Critical Methane Alert auto-tagged on Shift Checklist under CMR Reg. 153!");
          } else if (
            lower.includes("crack") ||
            lower.includes("roof") ||
            lower.includes("strata") ||
            lower.includes("छत") ||
            lower.includes("दरार")
          ) {
            setShiftTasks((prev) =>
              prev.map((t) =>
                t.id === "shift-03" ? { ...t, status: "hazard", notes: `Flagged via voice: "${transcript}"` } : t
              )
            );
            toast.error("Strata Convergence Alert auto-tagged on Shift Checklist under CMR Reg. 123!");
          }
        }
      };

      recognition.onerror = () => setIsVoiceRecording(false);
      recognition.onend = () => setIsVoiceRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsVoiceRecording(false);
    }
  };

  const selectedNode = allNodes.find((n) => n.id === selectedNodeId);

  // Connected nodes list for Selected Node Detail Panel
  const connectedNeighbors = useMemo(() => {
    if (!selectedNodeId) return [];
    const neighbors: Array<{ node: GraphNode; relationship: string }> = [];
    allEdges.forEach((e) => {
      if (e.source === selectedNodeId) {
        const t = allNodes.find((n) => n.id === e.target);
        if (t) neighbors.push({ node: t, relationship: e.relationship });
      } else if (e.target === selectedNodeId) {
        const s = allNodes.find((n) => n.id === e.source);
        if (s) neighbors.push({ node: s, relationship: e.relationship });
      }
    });
    return neighbors;
  }, [selectedNodeId, allEdges, allNodes]);

  // Entity Counts for Interactive Legend
  const entityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allNodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [allNodes]);

  // Completed Frontline Tasks Counter
  const completedTaskCount = shiftTasks.filter((t) => t.status === "passed").length;
  const hazardTaskCount = shiftTasks.filter((t) => t.status === "hazard").length;
  const shiftProgressPercent = Math.round((completedTaskCount / shiftTasks.length) * 100);

  return (
    <div className="space-y-5 pb-8">
      {/* ── Page Header & Top Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <IconGraph className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {language === "hi" ? "सांविधिक नियामक ज्ञान ग्राफ" : "Regulatory Knowledge Graph"}
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider ml-1 border-purple-500/30 text-purple-300">
              {language === "hi" ? "टोपोलॉजिकल जाल" : "Topological Network"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {language === "hi"
              ? `5 संकेंद्रित कक्षीय क्षेत्रों में ${allNodes.length} नियामक संस्थाएं और ${allEdges.length} अंतर-सांविधिक संबंध`
              : `Interactive topological simulation of ${allNodes.length} statutory entities across 5 concentric orbital zones with ${allEdges.length} inter-regulatory edges`}
          </p>
        </div>

        {/* Global Controls & Language Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
            className="h-8 gap-1.5 text-xs border-white/15 bg-white/5 hover:bg-white/10"
          >
            <IconLanguage className="h-3.5 w-3.5 text-sky-400" />
            <span>{language === "en" ? "हिंदी में देखें" : "View in English"}</span>
          </Button>

          {activeRoleConfig.viewMode === "graph" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProgressiveMode((p) => !p)}
                className={`h-8 gap-1.5 text-xs border-white/15 ${
                  progressiveMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-neutral-300"
                }`}
                title="Progressive Branch Disclosure: click nodes to expand/collapse"
              >
                {progressiveMode ? <IconEye className="h-3.5 w-3.5" /> : <IconEyeOff className="h-3.5 w-3.5" />}
                <span>{language === "hi" ? "प्रगतिशील शाखा विस्तार" : "Progressive Branches"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOrbitRings((r) => !r)}
                className={`h-8 gap-1.5 text-xs border-white/15 ${
                  showOrbitRings ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-white/5 text-neutral-300"
                }`}
              >
                <IconLayersIntersect className="h-3.5 w-3.5" />
                <span>{language === "hi" ? "कक्षीय क्षेत्र गाइड" : "Orbital Zones"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Role-Based Lens Selector Tabs ─────────────────────────────────────── */}
      <div className="p-2 rounded-xl bg-[#0b0f17] border border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              {language === "hi" ? "सक्रिय परिप्रेक्ष्य / लेंस:" : "Active Role Lens:"}
            </span>
            <Badge className={`text-xs px-2 py-0.5 border ${activeRoleConfig.badgeClass}`}>
              {language === "hi" ? activeRoleConfig.titleHi : activeRoleConfig.titleEn}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground italic">
            {language === "hi" ? activeRoleConfig.descriptionHi : activeRoleConfig.descriptionEn}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {Object.entries(ROLE_CONFIGS).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isSelected = selectedRoleKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedRoleKey(key);
                  if (cfg.defaultFilter !== "all") {
                    setSelectedFilterType(cfg.defaultFilter);
                  } else {
                    setSelectedFilterType("all");
                  }
                  toast.success(`Activated ${language === "hi" ? cfg.titleHi : cfg.titleEn}`);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left border ${
                  isSelected
                    ? "bg-white/10 text-white border-white/30 shadow-md ring-1 ring-white/20"
                    : "bg-white/[0.02] text-neutral-400 border-white/5 hover:bg-white/5 hover:text-neutral-200"
                }`}
              >
                <span className="shrink-0 flex items-center justify-center" style={{ color: isSelected ? cfg.accentColor : undefined }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="truncate">
                  <div className="font-semibold text-white truncate">
                    {language === "hi" ? cfg.titleHi.split(" ")[0] : cfg.titleEn.split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {cfg.viewMode === "checklist" ? "Shift Checklist" : "Force Graph"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODE A: FRONTLINE SIRDAR SHIFT & HAZARD CHECKLIST                      */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeRoleConfig.viewMode === "checklist" ? (
        <div className="space-y-4">
          {/* Urgent Circular Alert Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <IconAlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {language === "hi"
                      ? "डीजीएमएस तकनीकी परिपत्र सं. 02/2024 अनुपालन अनिवार्य"
                      : "Mandatory DGMS Technical Circular No. 02/2024"}
                  </span>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px]">
                    STATUTORY DIRECTIVE
                  </Badge>
                </div>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  {language === "hi"
                    ? "कंटीन्यूअस माइनर व लॉन्गवॉल पैनलों में छत अभिसरण (Tell-tale < 10mm) और री-बोल्टिंग टोकन सत्यापन अनिवार्य है।"
                    : "Continuous strata convergence monitoring (< 10 mm tell-tale dilation) and dual-height resin roof bolting mandatory in all mechanized seams."}
                </p>
              </div>
            </div>

            <Link href="/inspector">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs shrink-0 shadow-md">
                <IconArrowUpRight className="h-3.5 w-3.5 mr-1" />
                {language === "hi" ? "फील्ड इंस्पेक्टर खोलें" : "Open Field Inspector"}
              </Button>
            </Link>
          </div>

          {/* Sirdar Shift Status & Hands-Free Dictation Header */}
          <Card className="bg-[#0e141d] border-white/10 shadow-xl">
            <CardHeader className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconListCheck className="h-5 w-5 text-amber-400" />
                  {language === "hi" ? "खनन सरदार पूर्व-शिफ्ट सुरक्षा चेकलिस्ट" : "Mining Sirdar Statutory Pre-Shift Safety Audit"}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {language === "hi"
                    ? "कोयला खान विनियम 2017 के नियम 29, 30, 123, और 153 के तहत अनिवार्य शिफ्ट निरीक्षण"
                    : "Mandatory statutory underground checks pursuant to Coal Mines Regulations 2017 (Reg. 29, 30, 123, 153)"}
                </CardDescription>
              </div>

              {/* Progress and Dictate */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">
                    {completedTaskCount}/{shiftTasks.length} {language === "hi" ? "पूर्ण" : "Completed"}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    {hazardTaskCount > 0 ? `⚠️ ${hazardTaskCount} ${language === "hi" ? "खतरे दर्ज" : "Hazards Flagged"}` : "✓ All Normal"}
                  </div>
                </div>

                <div className="w-28 bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${hazardTaskCount > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${shiftProgressPercent}%` }}
                  />
                </div>

                <Button
                  size="sm"
                  onClick={toggleFrontlineVoice}
                  className={`h-8 gap-1.5 text-xs font-semibold shadow-md ${
                    isVoiceRecording
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-amber-500 hover:bg-amber-600 text-black"
                  }`}
                >
                  {isVoiceRecording ? <IconMicrophoneOff className="h-4 w-4" /> : <IconMicrophone className="h-4 w-4" />}
                  <span>{isVoiceRecording ? (language === "hi" ? "रिकॉर्डिंग जारी..." : "Recording...") : (language === "hi" ? "आवाज़ से बोलें" : "Voice Dictate")}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Voice transcript display */}
              {voiceTranscript && (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <IconSparkles className="h-3.5 w-3.5" />
                    <span>{language === "hi" ? "ध्वनि इनपुट लॉग (न्यूरो-सिम्बॉलिक टैग्ड):" : "Voice Input Log (Neuro-Symbolic Auto-Tagged):"}</span>
                  </div>
                  <p className="text-neutral-200 font-mono text-[11px]">{voiceTranscript}</p>
                </div>
              )}

              {/* Tasks List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shiftTasks.map((task) => {
                  const isHazard = task.status === "hazard";
                  const isPassed = task.status === "passed";

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isHazard
                          ? "bg-red-950/20 border-red-500/50 shadow-md ring-1 ring-red-500/20"
                          : isPassed
                          ? "bg-emerald-950/15 border-emerald-500/30"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-mono uppercase px-1.5 py-0 ${
                                task.severity === "critical"
                                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                                  : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                              }`}
                            >
                              {task.severity}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {language === "hi" ? task.regulationHi : task.regulationEn}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">
                            {language === "hi" ? task.titleHi : task.titleEn}
                          </h4>

                          <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                            {language === "hi" ? task.thresholdHi : task.thresholdEn}
                          </p>

                          {task.notes && (
                            <div className="mt-2 text-[10px] p-1.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                              ⚠️ {task.notes}
                            </div>
                          )}
                        </div>

                        {/* Status Checkbox Buttons */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setShiftTasks((prev) =>
                                prev.map((t) => (t.id === task.id ? { ...t, status: "passed" } : t))
                              );
                              toast.success(`Marked "${task.titleEn.slice(0, 24)}" as Compliant`);
                            }}
                            className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-all ${
                              isPassed
                                ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm"
                                : "bg-white/5 text-neutral-400 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300"
                            }`}
                            title="Mark as Compliant"
                          >
                            <IconCheck className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setShiftTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? {
                                        ...t,
                                        status: "hazard",
                                        notes: "Flagged by Sirdar during physical inspection.",
                                      }
                                    : t
                                )
                              );
                              toast.error(`Hazard detected on "${task.titleEn.slice(0, 24)}"`);
                            }}
                            className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-all ${
                              isHazard
                                ? "bg-red-500 text-white border-red-400 font-bold shadow-sm"
                                : "bg-white/5 text-neutral-400 border-white/10 hover:bg-red-500/20 hover:text-red-300"
                            }`}
                            title="Flag as Hazard / Non-Compliant"
                          >
                            <IconAlertTriangle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Action */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-sky-500/10 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="text-xs text-neutral-300">
                  <span className="font-semibold text-white">
                    {language === "hi" ? "शिफ्ट रिपोर्ट सत्यापन:" : "Statutory Shift Closure:"}
                  </span>{" "}
                  {language === "hi"
                    ? "सभी जांच पूरी होने के बाद निष्कर्षों को ब्लॉकचेन-हस्ताक्षरित फील्ड रिपोर्ट के रूप में सिंक करें।"
                    : "Synchronize shift findings directly with the tamper-evident field inspection ledger."}
                </div>
                <Link href="/inspector">
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-black font-semibold text-xs shadow-md">
                    <IconShieldCheck className="h-4 w-4 mr-1.5" />
                    {language === "hi" ? "डिजिटल डायरी जमा करें" : "Submit Signed Inspection"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────────── */
        /* MODE B: TOPOLOGICAL KNOWLEDGE GRAPH CANVAS (RADIAL / ZONE CLUSTERING)   */
        /* ─────────────────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Interactive Legend & Type Filter */}
          <div className="p-3 rounded-xl bg-[#0e141d]/90 border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                <IconFilter className="h-3 w-3" />
                {language === "hi" ? "संस्थाएं:" : "Entities:"}
              </span>

              {/* "All" button */}
              <button
                onClick={() => setSelectedFilterType("all")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedFilterType === "all"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                    : "bg-white/[0.03] text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{language === "hi" ? "सभी" : "All"}</span>
                <span className="text-[10px] font-mono opacity-75">({allNodes.length})</span>
              </button>

              {Object.entries(ENTITY_CONFIG).map(([type, cfg]) => {
                const isSelected = selectedFilterType === type;
                const count = entityCounts[type] || 0;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedFilterType(isSelected ? "all" : type)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-white/15 text-white border-white/30 shadow-sm"
                        : "bg-white/[0.03] text-neutral-300 border-white/5 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: cfg.color }} />
                    <span>{language === "hi" ? cfg.labelHi : cfg.labelEn}</span>
                    <span className="text-[10px] font-mono opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Branch Control Buttons */}
            {progressiveMode && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = new Set(allNodes.map((n) => n.id));
                    setExpandedNodeIds(allIds);
                    toast.success("Expanded all node branches");
                  }}
                  className="h-7 px-2 text-[11px] border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200"
                >
                  {language === "hi" ? "सभी शाखाएं खोलें" : "Expand All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const actIds = new Set(allNodes.filter((n) => n.type === "act").map((n) => n.id));
                    setExpandedNodeIds(actIds);
                    setSelectedNodeId(null);
                    toast.info("Collapsed back to primary root acts");
                  }}
                  className="h-7 px-2 text-[11px] border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200"
                >
                  {language === "hi" ? "मूल पर रीसेट करें" : "Reset to Roots"}
                </Button>
              </div>
            )}
          </div>

          {/* Canvas Wrapper */}
          <Card className="relative overflow-hidden border-white/10 bg-[#090d14] shadow-2xl">
            <CardContent className="p-0 relative">
              <canvas
                ref={canvasRef}
                className="w-full h-[640px] cursor-grab active:cursor-grabbing bg-radial from-[#0e1625] via-[#090d14] to-[#040608]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
                onWheel={(e) => {
                  e.preventDefault();
                  setZoom((z) => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)));
                }}
              />

              {/* Zone Legend HUD Bar on Canvas */}
              <div className="absolute top-3 left-3 hidden sm:flex items-center gap-2 p-1.5 px-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-400 shadow-xl pointer-events-none">
                <span className="text-purple-400 font-semibold">Z1: Acts</span>
                <span>→</span>
                <span className="text-cyan-400 font-semibold">Z2: Circulars</span>
                <span>→</span>
                <span className="text-emerald-400 font-semibold">Z3: Clauses</span>
                <span>→</span>
                <span className="text-amber-400 font-semibold">Z4: Mines</span>
                <span>→</span>
                <span className="text-red-400 font-semibold">Z5: Violations</span>
              </div>

              {/* Floating Entity Detail Inspector Panel */}
              {selectedNode && (
                <div className="absolute top-3 right-3 w-80 sm:w-96 max-h-[580px] overflow-y-auto bg-[#0b1018]/95 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl z-20 space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ENTITY_CONFIG[selectedNode.type]?.color || "#888" }}
                        />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {ENTITY_CONFIG[selectedNode.type]?.labelEn || selectedNode.type}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono py-0 px-1 border-white/20 text-neutral-300"
                        >
                          Zone {ENTITY_CONFIG[selectedNode.type]?.zone || 3}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{selectedNode.label}</h3>
                    </div>

                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 text-xs"
                      title="Close Inspector"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Metadata Fields */}
                  {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                    <div className="space-y-2 text-xs">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        {language === "hi" ? "सांविधिक विवरण" : "Statutory Attributes"}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
                        {Object.entries(selectedNode.metadata).map(([k, v]) => {
                          if (k === "clause_text" || k === "summary") return null;
                          return (
                            <div key={k} className="truncate">
                              <span className="text-neutral-400 uppercase text-[9px] font-mono block">
                                {k.replace("_", " ")}
                              </span>
                              <span className="font-semibold text-white">
                                {typeof v === "number" && k.includes("penalty")
                                  ? `₹${(v / 100000).toFixed(1)}L`
                                  : String(v)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Long text like clause_text or circular summary */}
                      {(selectedNode.metadata.clause_text || selectedNode.metadata.summary) && (
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-neutral-300 leading-relaxed">
                          {selectedNode.metadata.clause_text || selectedNode.metadata.summary}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Topological Neighbors */}
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                      <span>{language === "hi" ? "संबंधित संस्थाएं" : "Connected Entities"}</span>
                      <span className="text-[10px]">({connectedNeighbors.length})</span>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                      {connectedNeighbors.length === 0 ? (
                        <div className="text-xs text-neutral-400 italic">No direct connections visible.</div>
                      ) : (
                        connectedNeighbors.map(({ node, relationship }) => (
                          <button
                            key={node.id}
                            onClick={() => handleFocusNode(node.id)}
                            className="w-full text-left flex items-center justify-between p-1.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/10 border border-white/5 transition-all text-xs group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: ENTITY_CONFIG[node.type]?.color || "#888" }}
                              />
                              <span className="text-neutral-200 truncate group-hover:text-white">
                                {node.label}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-sky-400 shrink-0 uppercase ml-2">
                              {relationship.replace("_", " ")}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                    <Button
                      size="sm"
                      onClick={() => handleFocusNode(selectedNode.id)}
                      className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    >
                      <IconArrowsDiagonal className="h-3.5 w-3.5 mr-1" />
                      {language === "hi" ? "केंद्र में लाएं" : "Center & Focus"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Viewport Floating Controls */}
              <div className="absolute bottom-4 right-4 flex gap-1.5 p-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 shadow-2xl z-10">
                <button
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 text-neutral-200 hover:text-white transition-all"
                  title="Zoom In"
                >
                  <IconZoomIn size={16} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 text-neutral-200 hover:text-white transition-all"
                  title="Zoom Out"
                >
                  <IconZoomOut size={16} />
                </button>
                <button
                  onClick={() => {
                    setZoom(0.85);
                    setOffset({ x: 0, y: 0 });
                    setSelectedNodeId(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 text-neutral-200 hover:text-white transition-all"
                  title="Reset View"
                >
                  <IconRefresh size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
