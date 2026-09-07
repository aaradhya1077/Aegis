"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconGraph, IconZoomIn, IconZoomOut, IconRefresh } from "@tabler/icons-react";
import { fetchRegulationGraph } from "@/lib/api";

const NODE_COLORS: Record<string, string> = {
  act: "#7C3AED",
  clause: "#10B981",
  obligation: "#F59E0B",
  filing_type: "#3B82F6",
  mine: "#EF4444",
};

const NODE_SIZES: Record<string, number> = {
  act: 22,
  clause: 12,
  obligation: 18,
  filing_type: 15,
  mine: 8,
};

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export default function KnowledgeGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const animFrame = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetchRegulationGraph()
      .then((data) => {
        // Position nodes using a simple radial layout by type
        const typeGroups: Record<string, typeof data.nodes> = {};
        data.nodes.forEach((n) => {
          if (!typeGroups[n.type]) typeGroups[n.type] = [];
          typeGroups[n.type].push(n);
        });

        const centerX = 600;
        const centerY = 400;
        const typeRadii: Record<string, number> = {
          act: 50,
          obligation: 150,
          clause: 280,
          filing_type: 200,
          mine: 400,
        };

        const positioned: GraphNode[] = [];
        Object.entries(typeGroups).forEach(([type, group]) => {
          const radius = typeRadii[type] || 300;
          group.forEach((n, i) => {
            const angle = (2 * Math.PI * i) / group.length + (Math.random() * 0.3);
            positioned.push({
              id: n.id,
              label: n.label,
              type: n.type,
              x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
              y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
              vx: 0,
              vy: 0,
            });
          });
        });

        setNodes(positioned);
        setEdges(data.edges);
        setStats({ nodes: data.nodes.length, edges: data.edges.length });
      })
      .catch(console.error);
  }, []);

  // Simple force simulation
  const simulate = useCallback(() => {
    if (nodes.length === 0) return;

    const newNodes = nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(newNodes.map((n) => [n.id, n]));

    // Repulsion
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const dx = newNodes[j].x - newNodes[i].x;
        const dy = newNodes[j].y - newNodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 800 / (dist * dist);
        newNodes[i].vx -= (dx / dist) * force;
        newNodes[i].vy -= (dy / dist) * force;
        newNodes[j].vx += (dx / dist) * force;
        newNodes[j].vy += (dy / dist) * force;
      }
    }

    // Attraction along edges
    edges.forEach((e) => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - 120) * 0.005;
        source.vx += (dx / dist) * force;
        source.vy += (dy / dist) * force;
        target.vx -= (dx / dist) * force;
        target.vy -= (dy / dist) * force;
      }
    });

    // Apply velocity with damping
    newNodes.forEach((n) => {
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
    });

    setNodes(newNodes);
  }, [nodes, edges]);

  // Run simulation for initial frames
  const simCount = useRef(0);
  useEffect(() => {
    if (simCount.current < 100 && nodes.length > 0) {
      animFrame.current = requestAnimationFrame(() => {
        simulate();
        simCount.current++;
      });
    }
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [nodes, simulate]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw edges
    ctx.globalAlpha = 0.15;
    edges.forEach((e) => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // Draw nodes
    nodes.forEach((n) => {
      const size = NODE_SIZES[n.type] || 10;
      const color = NODE_COLORS[n.type] || "#888";

      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color + "40";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Labels for larger nodes
      if (size >= 15) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").includes("0.97") ? "#e5e7eb" : "#374151";
        ctx.font = `${Math.max(8, size * 0.55)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(n.label.slice(0, 30), n.x, n.y + size + 12);
      }
    });

    ctx.restore();
  }, [nodes, edges, zoom, offset]);

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }

    // Hover detection
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / zoom;
    const my = (e.clientY - rect.top - offset.y) / zoom;

    const found = nodes.find((n) => {
      const size = NODE_SIZES[n.type] || 10;
      const dx = n.x - mx;
      const dy = n.y - my;
      return dx * dx + dy * dy < size * size * 4;
    });
    setHoveredNode(found || null);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regulatory Knowledge Graph</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interactive visualization of {stats.nodes} regulation nodes and {stats.edges} relationships
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => {
              e.preventDefault();
              setZoom((z) => Math.max(0.2, Math.min(3, z - e.deltaY * 0.001)));
            }}
          />

          {/* Hover tooltip */}
          {hoveredNode && (
            <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg max-w-[250px]">
              <p className="text-sm font-medium">{hoveredNode.label}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                Type: {hoveredNode.type.replace("_", " ")}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <IconZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <IconZoomOut size={16} />
            </button>
            <button
              onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <IconRefresh size={16} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
