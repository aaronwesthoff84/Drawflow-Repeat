import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";
import { TopBar } from "./TopBar";
import { Palette } from "./Palette";
import { DrawFlowNode, DrawFlowEdge, Diagram } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHistory } from "../hooks/useHistory";
import { toPng, toSvg } from "html-to-image";
import {
  Workflow, Copy, Trash2, FileText,
  Globe, Smartphone, User, Zap, Server, Cpu,
  Database, Layers, List, Activity, Globe2, LineChart,
  X, Search, ChevronUp, ChevronDown, Monitor, Lock, Unlock,
} from "lucide-react";
import { CodePanel } from "./CodePanel";
import { AIPanel } from "./AIPanel";
import { NotesPanel } from "./NotesPanel";
import { CommandPalette } from "./CommandPalette";
import { TemplateModal } from "./TemplateModal";
import { parseDiagramDSL } from "../lib/diagramParser";
import { exportToMermaid } from "../lib/mermaidExporter";
import { EditableEdge } from "./EditableEdge";

const nodeTypes: NodeTypes = { custom: CustomNode as NodeTypes[string] };
const edgeTypes: EdgeTypes = { editable: EditableEdge as EdgeTypes[string] };

function generateNodeId(type: string, existingNodes: DrawFlowNode[]): string {
  const prefix = type.toUpperCase();
  const existingIds = new Set(existingNodes.map(n => n.id));
  let n = 1;
  while (existingIds.has(`${prefix}_${n}`)) n++;
  return `${prefix}_${n}`;
}

const initialNodes: DrawFlowNode[] = [];
const initialEdges: Edge[] = [];

const QUICK_ADD_TYPES = [
  { type: "web", category: "frontend", Icon: Globe, label: "Web" },
  { type: "mobile", category: "frontend", Icon: Smartphone, label: "Mobile" },
  { type: "user", category: "frontend", Icon: User, label: "User" },
  { type: "api", category: "backend", Icon: Zap, label: "API" },
  { type: "service", category: "backend", Icon: Server, label: "Service" },
  { type: "worker", category: "backend", Icon: Cpu, label: "Worker" },
  { type: "db", category: "data", Icon: Database, label: "DB" },
  { type: "cache", category: "data", Icon: Layers, label: "Cache" },
  { type: "queue", category: "data", Icon: List, label: "Queue" },
  { type: "stream", category: "data", Icon: Activity, label: "Stream" },
  { type: "external", category: "infra", Icon: Globe2, label: "External" },
  { type: "metrics", category: "infra", Icon: LineChart, label: "Metrics" },
] as const;

const EDGE_COLORS = [
  { label: "Gray", value: "#8b949e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Yellow", value: "#eab308" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#a855f7" },
];

export function DiagramEditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [diagramName, setDiagramName] = useState("Untitled Diagram");
  const [diagramId, setDiagramId] = useState(crypto.randomUUID());

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { toast } = useToast();
  const { fitView, getNodes, getEdges, setCenter } = useReactFlow();

  // Panel / feature states
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant | "none">(BackgroundVariant.Dots);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // New feature states
  const [clipboard, setClipboard] = useState<{ nodes: DrawFlowNode[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const pasteCountRef = useRef(0);
  const [quickAddMenu, setQuickAddMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edge: Edge } | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findIndex, setFindIndex] = useState(0);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);
  const [mermaidCode, setMermaidCode] = useState("");
  const findInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: DrawFlowNode } | null>(null);
  const [editingEdge, setEditingEdge] = useState<{ id: string; label: string; x: number; y: number } | null>(null);

  // History Hook
  const { takeSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useHistory<DrawFlowNode, Edge>();

  // Find matches
  const findMatches = useMemo(() => {
    if (!findQuery.trim()) return [];
    return nodes.filter(n => n.data.label.toLowerCase().includes(findQuery.toLowerCase()));
  }, [nodes, findQuery]);

  const navigateToMatch = useCallback((idx: number) => {
    const clamped = ((idx % findMatches.length) + findMatches.length) % findMatches.length;
    setFindIndex(clamped);
    const node = findMatches[clamped];
    if (!node) return;
    setCenter(node.position.x + 90, node.position.y + 40, { zoom: 1.4, duration: 500 });
    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
  }, [findMatches, setCenter, setNodes]);

  const closeAllMenus = useCallback(() => {
    setContextMenu(null);
    setEdgeContextMenu(null);
    setQuickAddMenu(null);
  }, []);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    const hasStructuralChanges = changes.some((c: any) =>
      c.type === "remove" || c.type === "add" ||
      (c.type === "position" && !c.dragging && c.position)
    );
    if (hasStructuralChanges) takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
  }, [onNodesChange, takeSnapshot, getNodes, getEdges]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    const hasStructuralChanges = changes.some((c: any) => c.type === "remove" || c.type === "add");
    if (hasStructuralChanges) takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
  }, [onEdgesChange, takeSnapshot, getNodes, getEdges]);

  const onConnect = useCallback((params: Connection | Edge) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEdges(eds => addEdge({ ...params, type: "editable", animated: true, markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: "#8b949e" }, style: { stroke: "#8b949e", strokeWidth: 2 }, data: { waypoints: [] } } as any, eds));
  }, [setEdges, takeSnapshot, getNodes, getEdges]);

  const handleUndo = useCallback(() => {
    const previous = undo(getNodes() as DrawFlowNode[], getEdges());
    if (previous) { setNodes(previous.nodes); setEdges(previous.edges); }
  }, [undo, getNodes, getEdges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const next = redo(getNodes() as DrawFlowNode[], getEdges());
    if (next) { setNodes(next.nodes); setEdges(next.edges); }
  }, [redo, getNodes, getEdges, setNodes, setEdges]);

  // Copy / Paste
  const handleCopy = useCallback(() => {
    const selected = getNodes().filter(n => n.selected) as DrawFlowNode[];
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map(n => n.id));
    const relEdges = getEdges().filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
    setClipboard({ nodes: selected, edges: relEdges });
    pasteCountRef.current = 0;
    toast({ title: `Copied ${selected.length} node(s)` });
  }, [getNodes, getEdges, toast]);

  const handlePaste = useCallback(() => {
    if (clipboard.nodes.length === 0) return;
    pasteCountRef.current += 1;
    const offset = pasteCountRef.current * 30;
    const idMap = new Map<string, string>();
    const newNodes: DrawFlowNode[] = clipboard.nodes.map(n => {
      const newId = crypto.randomUUID();
      idMap.set(n.id, newId);
      return { ...n, id: newId, position: { x: n.position.x + offset, y: n.position.y + offset }, selected: true };
    });
    const newEdges: Edge[] = clipboard.edges.map(e => ({
      ...e,
      id: crypto.randomUUID(),
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }));
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
    setEdges(eds => [...eds, ...newEdges]);
  }, [clipboard, getNodes, getEdges, setNodes, setEdges, takeSnapshot]);

  // Mermaid export
  const handleExportMermaid = useCallback(() => {
    const code = exportToMermaid(nodes, edges);
    setMermaidCode(code);
    setIsMermaidModalOpen(true);
    navigator.clipboard.writeText(code).then(() =>
      toast({ title: "Mermaid code copied to clipboard" })
    ).catch(() => {});
  }, [nodes, edges, toast]);

  // Import JSON
  const handleImportJson = useCallback(() => {
    try {
      const data = JSON.parse(importJson);
      if (!Array.isArray(data.nodes)) throw new Error("Invalid format");
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setNodes(data.nodes);
      setEdges(data.edges || []);
      if (data.name) setDiagramName(data.name);
      setImportJson("");
      setIsImportDialogOpen(false);
      setTimeout(() => fitView({ duration: 800 }), 100);
      toast({ title: "Diagram imported successfully" });
    } catch {
      toast({ title: "Invalid JSON format", variant: "destructive" });
    }
  }, [importJson, getNodes, getEdges, takeSnapshot, setNodes, setEdges, fitView, toast]);

  // Presentation mode
  const handleTogglePresentation = useCallback(() => {
    setIsPresentationMode(prev => {
      if (!prev) {
        setTimeout(() => fitView({ duration: 800, padding: 0.1 }), 150);
        try { document.documentElement.requestFullscreen?.(); } catch (_) {}
      } else {
        try { document.exitFullscreen?.(); } catch (_) {}
      }
      return !prev;
    });
  }, [fitView]);

  // Quick-add on double-click canvas
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".react-flow__node") || target.closest(".react-flow__edge")) return;
    if (!reactFlowInstance) return;
    e.stopPropagation();
    const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setQuickAddMenu({ x: e.clientX, y: e.clientY, flowX: pos.x, flowY: pos.y });
  }, [reactFlowInstance]);

  const handleQuickAddNode = useCallback((type: string, category: string, flowX: number, flowY: number) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    const existingNodes = getNodes() as DrawFlowNode[];
    const newNode: DrawFlowNode = {
      id: generateNodeId(type, existingNodes),
      type: "custom",
      position: { x: flowX - 90, y: flowY - 40 },
      data: { label: type, type: type as any, category: category as any },
    };
    setNodes(nds => [...nds, newNode]);
    setQuickAddMenu(null);
  }, [getNodes, getEdges, setNodes, takeSnapshot]);

  // Edge context menu
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeContextMenu({ x: event.clientX, y: event.clientY, edge });
  }, []);

  const updateEdgeStyle = useCallback((edgeId: string, styleOverride: Partial<React.CSSProperties>) => {
    setEdges(eds => eds.map(e => e.id === edgeId ? { ...e, style: { ...e.style, ...styleOverride } } : e));
  }, [setEdges]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsFindOpen(prev => !prev);
        if (!isFindOpen) setTimeout(() => findInputRef.current?.focus(), 50);
        return;
      }
      if (e.key === "Escape") {
        if (isFindOpen) { setIsFindOpen(false); setFindQuery(""); return; }
        if (quickAddMenu) { setQuickAddMenu(null); return; }
        if (edgeContextMenu) { setEdgeContextMenu(null); return; }
        if (editingEdge) { setEditingEdge(null); return; }
        if (contextMenu) { setContextMenu(null); return; }
        if (isPresentationMode) { handleTogglePresentation(); return; }
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })));
        setIsCommandPaletteOpen(false);
        return;
      }

      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const selNodes = getNodes().filter(n => n.selected);
        const selEdges = getEdges().filter(e => e.selected);
        if (selNodes.length > 0 || selEdges.length > 0) {
          takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
          setNodes(nds => nds.filter(n => !n.selected));
          setEdges(eds => eds.filter(e => !e.selected));
        }
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(e => ({ ...e, selected: true })));
      } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleCopy();
      } else if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePaste();
      } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const allNodes = getNodes();
        const selected = allNodes.filter(n => n.selected);
        if (selected.length !== 1) return;
        e.preventDefault();
        const cur = selected[0];
        let best: typeof cur | null = null;
        let bestDist = Infinity;
        for (const n of allNodes) {
          if (n.id === cur.id) continue;
          const dx = n.position.x - cur.position.x;
          const dy = n.position.y - cur.position.y;
          const inDir =
            (e.key === "ArrowRight" && dx > 20 && Math.abs(dy) < Math.abs(dx)) ||
            (e.key === "ArrowLeft" && dx < -20 && Math.abs(dy) < Math.abs(dx)) ||
            (e.key === "ArrowDown" && dy > 20 && Math.abs(dx) < Math.abs(dy)) ||
            (e.key === "ArrowUp" && dy < -20 && Math.abs(dx) < Math.abs(dy));
          if (inDir) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) { bestDist = dist; best = n; }
          }
        }
        if (best) {
          setNodes(nds => nds.map(n => ({ ...n, selected: n.id === best!.id })));
          setCenter(best.position.x + 90, best.position.y + 40, { zoom: 1.2, duration: 400 });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    getNodes, getEdges, setNodes, setEdges, handleUndo, handleRedo, handleCopy, handlePaste,
    takeSnapshot, isFindOpen, quickAddMenu, edgeContextMenu, editingEdge, contextMenu,
    isPresentationMode, handleTogglePresentation, setCenter,
  ]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowInstance) return;
    const type = event.dataTransfer.getData("application/reactflow/type");
    const category = event.dataTransfer.getData("application/reactflow/category");
    if (!type || !category) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const existingNodes = getNodes() as DrawFlowNode[];
    const newNode: DrawFlowNode = {
      id: generateNodeId(type, existingNodes),
      type: "custom",
      position,
      data: { label: `${type} node`, type: type as any, category: category as any },
    };
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    setNodes(nds => nds.concat(newNode));
  }, [reactFlowInstance, setNodes, takeSnapshot, getNodes, getEdges]);

  const handleNew = () => {
    if (confirm("Clear the canvas? Unsaved changes will be lost.")) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setNodes([]); setEdges([]);
      setDiagramName("Untitled Diagram");
      setDiagramId(crypto.randomUUID());
      clearHistory();
    }
  };

  const handleSave = () => {
    const diagram: Diagram = { id: diagramId, name: diagramName, nodes, edges, updatedAt: new Date().toISOString() };
    const existing: Diagram[] = JSON.parse(localStorage.getItem("drawflow_diagrams") || "[]");
    const updated = [...existing.filter(d => d.id !== diagramId), diagram];
    localStorage.setItem("drawflow_diagrams", JSON.stringify(updated));
    toast({ title: "Diagram saved", description: `Saved "${diagramName}" to local storage.` });
  };

  const handleLoad = (diagram: Diagram) => {
    const loadedNodes = (diagram.nodes || []).map(n => ({
      ...n,
      draggable: n.data.locked ? false : undefined,
    }));
    // Migrate legacy smoothstep edges to editable type
    const loadedEdges = (diagram.edges || []).map(e => ({
      ...e,
      type: (e.type === "smoothstep" || !e.type) ? "editable" : e.type,
      data: e.data ?? { waypoints: [] },
    }));
    setNodes(loadedNodes); setEdges(loadedEdges);
    setDiagramName(diagram.name); setDiagramId(diagram.id as any);
    setIsLoadDialogOpen(false); clearHistory();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(JSON.stringify({ nodes, edges, name: diagramName }, null, 2));
    toast({ title: "Copied to clipboard", description: "Diagram JSON copied." });
  };

  const handleExportPNG = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    const viewport = reactFlowWrapper.current.querySelector(".react-flow__viewport") as HTMLElement;
    if (!viewport) return;
    toast({ title: "Exporting PNG..." });
    fitView({ padding: 0.2 });
    setTimeout(() => {
      toPng(viewport, { backgroundColor: "#0f1117", pixelRatio: 2 })
        .then(url => { const a = document.createElement("a"); a.download = `${diagramName.replace(/\s+/g, "_").toLowerCase()}.png`; a.href = url; a.click(); toast({ title: "Export complete!" }); })
        .catch(() => toast({ title: "Export failed", variant: "destructive" }));
    }, 500);
  }, [diagramName, fitView, toast]);

  const handleExportSVG = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    const viewport = reactFlowWrapper.current.querySelector(".react-flow__viewport") as HTMLElement;
    if (!viewport) return;
    toast({ title: "Exporting SVG..." });
    fitView({ padding: 0.2 });
    setTimeout(() => {
      toSvg(viewport, { backgroundColor: "#0f1117" })
        .then(url => { const a = document.createElement("a"); a.download = `${diagramName.replace(/\s+/g, "_").toLowerCase()}.svg`; a.href = url; a.click(); toast({ title: "Export complete!" }); })
        .catch(() => toast({ title: "Export failed", variant: "destructive" }));
    }, 500);
  }, [diagramName, fitView, toast]);

  const handleLayout = useCallback(() => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    const categories = ["frontend", "backend", "data", "infra", "utils"];
    const layoutNodes = [...getNodes()] as DrawFlowNode[];
    let currentX = 0;
    categories.forEach(cat => {
      const catNodes = layoutNodes.filter(n => n.data.category === cat);
      if (catNodes.length === 0) return;
      catNodes.forEach((node, index) => { node.position = { x: currentX, y: index * 150 }; });
      currentX += 220;
    });
    setNodes(layoutNodes);
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 50);
  }, [getNodes, getEdges, setNodes, fitView, takeSnapshot]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node: node as DrawFlowNode });
  }, []);

  const handleDuplicateNode = useCallback((n: DrawFlowNode) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    setNodes(nds => [...nds, { ...n, id: crypto.randomUUID(), position: { x: n.position.x + 20, y: n.position.y + 20 }, selected: false }]);
    setContextMenu(null);
  }, [getNodes, getEdges, setNodes, takeSnapshot]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setContextMenu(null);
  }, [getNodes, getEdges, setNodes, setEdges, takeSnapshot]);

  const handleAddNoteToNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, notes: n.data.notes || " " } } : n));
    setContextMenu(null);
  }, [setNodes]);

  const handleLockNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.map(n => n.id === nodeId
      ? { ...n, draggable: !!n.data.locked, data: { ...n.data, locked: !n.data.locked } }
      : n
    ));
    setContextMenu(null);
  }, [setNodes]);

  const handleCycleBgVariant = useCallback(() => {
    const variants: (BackgroundVariant | "none")[] = [BackgroundVariant.Dots, BackgroundVariant.Lines, BackgroundVariant.Cross, "none"];
    setBgVariant(v => variants[(variants.indexOf(v) + 1) % variants.length]);
  }, []);

  const onEdgeDoubleClick = useCallback((evt: React.MouseEvent, edge: Edge) => {
    evt.stopPropagation();
    setEditingEdge({ id: edge.id, label: (edge.label as string) || "", x: evt.clientX, y: evt.clientY });
  }, []);

  const saveEdgeLabel = useCallback(() => {
    if (!editingEdge) return;
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    setEdges(eds => eds.map(e => e.id === editingEdge.id ? {
      ...e, label: editingEdge.label,
      labelStyle: { fill: "#d1d5db", fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: "#1a1f2e", stroke: "#374151" },
      labelBgPadding: [6, 4], labelBgBorderRadius: 4,
    } : e));
    setEditingEdge(null);
  }, [editingEdge, setEdges, takeSnapshot, getNodes, getEdges]);

  const handleApplyTemplate = (dsl: string) => {
    const result = parseDiagramDSL(dsl);
    if (result.errors.length === 0) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setNodes(result.nodes); setEdges(result.edges);
      setTimeout(() => fitView({ duration: 800 }), 50);
    } else {
      toast({ title: "Template parse error", variant: "destructive" });
    }
  };

  const handleApplyDSL = (newNodes: DrawFlowNode[], newEdges: DrawFlowEdge[]) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    const posMap = new Map(nodes.map(n => [n.id, n.position]));
    setNodes(newNodes.map(n => posMap.has(n.id) ? { ...n, position: posMap.get(n.id)! } : n));
    setEdges(newEdges);
  };

  const handleCommandAction = (action: string, payload?: any) => {
    switch (action) {
      case "NEW_DIAGRAM": handleNew(); break;
      case "SAVE_DIAGRAM": handleSave(); break;
      case "OPEN_DIAGRAM": setIsLoadDialogOpen(true); break;
      case "EXPORT_PNG": handleExportPNG(); break;
      case "EXPORT_SVG": handleExportSVG(); break;
      case "EXPORT_MERMAID": handleExportMermaid(); break;
      case "IMPORT": setIsImportDialogOpen(true); break;
      case "TOGGLE_CODE": setIsCodePanelOpen(p => !p); break;
      case "TOGGLE_AI": setIsAIPanelOpen(p => !p); break;
      case "TOGGLE_NOTES": setIsNotesPanelOpen(p => !p); break;
      case "TOGGLE_PALETTE": setIsPaletteVisible(p => !p); break;
      case "TOGGLE_PRESENTATION": handleTogglePresentation(); break;
      case "AUTO_LAYOUT": handleLayout(); break;
      case "FIT_VIEW": fitView({ duration: 800 }); break;
      case "TOGGLE_SNAP": setSnapToGrid(p => !p); break;
      case "SHOW_SHORTCUTS": setIsShortcutsDialogOpen(true); break;
      case "CLEAR_CANVAS": handleNew(); break;
      case "LOAD_DIAGRAM": if (payload) handleLoad(payload); break;
      case "OPEN_TEMPLATES": setIsTemplateModalOpen(true); break;
    }
  };

  const savedDiagrams = JSON.parse(localStorage.getItem("drawflow_diagrams") || "[]") as Diagram[];
  const selectedNodes = nodes.filter(n => n.selected);

  // Presentation mode — render only the canvas
  if (isPresentationMode) {
    return (
      <div className="fixed inset-0 bg-[#0f1117] z-50">
        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}
            onConnect={onConnect} onInit={setReactFlowInstance}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            snapToGrid={snapToGrid} snapGrid={snapToGrid ? [20, 20] : undefined}
            className="bg-[#0f1117]"
          >
            {bgVariant !== "none" && <Background variant={bgVariant} color="#333" gap={16} />}
          </ReactFlow>
        </div>
        <button
          onClick={handleTogglePresentation}
          className="absolute top-4 right-4 flex items-center gap-2 bg-[#1a1f2e] border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm transition-colors shadow-xl"
        >
          <X className="w-4 h-4" /> Exit Presentation
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-[#0f1117] text-white overflow-hidden"
      onClick={() => { closeAllMenus(); if (editingEdge) saveEdgeLabel(); }}
    >
      <TopBar
        name={diagramName} setName={setDiagramName}
        onNew={handleNew} onSave={handleSave} onLoad={() => setIsLoadDialogOpen(true)} onShare={handleShare}
        onTogglePalette={() => setIsPaletteVisible(p => !p)} isPaletteVisible={isPaletteVisible}
        canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo}
        onExportPNG={handleExportPNG} onExportSVG={handleExportSVG}
        onExportMermaid={handleExportMermaid}
        onImport={() => setIsImportDialogOpen(true)}
        onLayout={handleLayout}
        onShortcutsHelp={() => setIsShortcutsDialogOpen(true)}
        bgVariant={bgVariant === "none" ? BackgroundVariant.Dots : bgVariant}
        onCycleBgVariant={handleCycleBgVariant}
        snapToGrid={snapToGrid} onToggleSnap={() => setSnapToGrid(p => !p)}
        isCodePanelOpen={isCodePanelOpen} onToggleCodePanel={() => setIsCodePanelOpen(p => !p)}
        isAIPanelOpen={isAIPanelOpen} onToggleAIPanel={() => setIsAIPanelOpen(p => !p)}
        isNotesPanelOpen={isNotesPanelOpen} onToggleNotesPanel={() => setIsNotesPanelOpen(p => !p)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onTogglePresentation={handleTogglePresentation}
        isMinimapVisible={isMinimapVisible}
        onToggleMinimap={() => setIsMinimapVisible(p => !p)}
      />

      {/* Find / Search bar */}
      {isFindOpen && (
        <div className="h-10 bg-[#1a1f2e] border-b border-[#2a3040] flex items-center gap-2 px-4 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            ref={findInputRef}
            value={findQuery}
            onChange={e => { setFindQuery(e.target.value); setFindIndex(0); }}
            onKeyDown={e => {
              if (e.key === "Enter") navigateToMatch(e.shiftKey ? findIndex - 1 : findIndex + 1);
              if (e.key === "Escape") { setIsFindOpen(false); setFindQuery(""); }
              e.stopPropagation();
            }}
            placeholder="Find nodes by label..."
            className="flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder-gray-600"
          />
          {findQuery && (
            <span className="text-xs text-gray-500 shrink-0">
              {findMatches.length > 0 ? `${findIndex + 1} of ${findMatches.length}` : "No matches"}
            </span>
          )}
          <button onClick={() => navigateToMatch(findIndex - 1)} disabled={findMatches.length === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30 rounded">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => navigateToMatch(findIndex + 1)} disabled={findMatches.length === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30 rounded">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsFindOpen(false); setFindQuery(""); }} className="p-1 text-gray-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isPaletteVisible && <Palette />}

      <div className="flex flex-1 overflow-hidden relative">
        <NotesPanel isOpen={isNotesPanelOpen} onClose={() => setIsNotesPanelOpen(false)} diagramId={diagramId} />

        <div className="flex-1 w-full relative" ref={reactFlowWrapper} onDoubleClick={handleCanvasDoubleClick}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}
            onConnect={onConnect} onInit={setReactFlowInstance}
            onDrop={onDrop} onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={closeAllMenus}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            snapToGrid={snapToGrid} snapGrid={snapToGrid ? [20, 20] : undefined}
            fitView className="bg-[#0f1117]"
          >
            {bgVariant !== "none" && <Background variant={bgVariant} color="#333" gap={16} />}
            {isMinimapVisible && <MiniMap nodeColor={n => (n.data?.accentColor as string) || "#444"} maskColor="rgba(0,0,0,0.7)" style={{ backgroundColor: "#1a1f2e" }} />}
            <Controls className="bg-[#1a1f2e] border-gray-800 text-white fill-white" />

            {nodes.length === 0 && (
              <Panel position="top-center" className="pointer-events-none" style={{ top: "40%" }}>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 backdrop-blur-sm">
                  <Workflow className="w-12 h-12 text-gray-500 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-300 mb-2">Start building your diagram</h2>
                  <p className="text-gray-500 text-sm text-center">Drag nodes from the palette, double-click canvas, or use a template</p>
                </div>
              </Panel>
            )}

            {selectedNodes.length > 0 && (
              <Panel position="top-center" className="mt-4 pointer-events-auto">
                <div className="flex items-center gap-1 bg-[#1a1f2e] border border-gray-700 rounded-lg p-1.5 shadow-xl">
                  <span className="px-2 text-xs font-medium text-gray-400 border-r border-gray-700 mr-1">{selectedNodes.length} selected</span>
                  {selectedNodes.length === 1 && (
                    <button className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors" onClick={() => handleDuplicateNode(selectedNodes[0])} title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors"
                    onClick={() => {
                      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
                      const ids = new Set(selectedNodes.map(n => n.id));
                      setNodes(nds => nds.filter(n => !ids.has(n.id)));
                      setEdges(eds => eds.filter(e => !ids.has(e.source) && !ids.has(e.target)));
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Panel>
            )}
          </ReactFlow>

          {/* Node context menu */}
          {contextMenu && (
            <div
              className="fixed bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px] z-50"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b border-gray-800 mb-1">{contextMenu.node.data.label}</div>
              <button className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2" onClick={() => handleDuplicateNode(contextMenu.node)}>
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2" onClick={() => handleAddNoteToNode(contextMenu.node.id)}>
                <FileText className="w-4 h-4" /> Add Note
              </button>
              <button
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                  contextMenu.node.data.locked
                    ? "text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                    : "text-gray-200 hover:bg-yellow-500/10 hover:text-yellow-300"
                }`}
                onClick={() => handleLockNode(contextMenu.node.id)}
              >
                {contextMenu.node.data.locked
                  ? <><Unlock className="w-4 h-4" /> Unlock Node</>
                  : <><Lock className="w-4 h-4" /> Lock Node</>
                }
              </button>
              <div className="my-1 border-t border-gray-800" />
              <button className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2" onClick={() => handleDeleteNode(contextMenu.node.id)}>
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}

          {/* Edge context menu */}
          {edgeContextMenu && (
            <div
              className="fixed bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50"
              style={{ top: edgeContextMenu.y, left: edgeContextMenu.x }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase border-b border-gray-800 mb-2">Edge Style</div>
              <div className="px-3 flex gap-1 mb-2">
                {[
                  { label: "Solid", style: {} },
                  { label: "Dashed", style: { strokeDasharray: "8 4" } },
                  { label: "Dotted", style: { strokeDasharray: "2 4" } },
                ].map(({ label, style }) => (
                  <button
                    key={label}
                    className="flex-1 text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => { updateEdgeStyle(edgeContextMenu.edge.id, style); setEdgeContextMenu(null); }}
                  >{label}</button>
                ))}
              </div>
              <div className="px-3 flex gap-1 mb-2">
                {[
                  { label: "Thin", w: 1 },
                  { label: "Normal", w: 2 },
                  { label: "Thick", w: 4 },
                ].map(({ label, w }) => (
                  <button
                    key={label}
                    className="flex-1 text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => { updateEdgeStyle(edgeContextMenu.edge.id, { strokeWidth: w }); setEdgeContextMenu(null); }}
                  >{label}</button>
                ))}
              </div>
              <div className="px-3 mb-2">
                <div className="text-xs text-gray-500 mb-1">Color</div>
                <div className="flex gap-1">
                  {EDGE_COLORS.map(({ label, value }) => (
                    <button
                      key={value}
                      title={label}
                      className="w-5 h-5 rounded-full border border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: value }}
                      onClick={() => {
                        updateEdgeStyle(edgeContextMenu.edge.id, { stroke: value });
                        setEdges(eds => eds.map(e => e.id === edgeContextMenu.edge.id ? {
                          ...e, markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: value },
                        } : e));
                        setEdgeContextMenu(null);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-800 mt-1 pt-1">
                <button
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2"
                  onClick={() => {
                    setEditingEdge({ id: edgeContextMenu.edge.id, label: (edgeContextMenu.edge.label as string) || "", x: edgeContextMenu.x, y: edgeContextMenu.y });
                    setEdgeContextMenu(null);
                  }}
                >
                  <FileText className="w-3.5 h-3.5" /> Add Label
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2"
                  onClick={() => {
                    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
                    setEdges(eds => eds.filter(e => e.id !== edgeContextMenu.edge.id));
                    setEdgeContextMenu(null);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Quick-add menu */}
          {quickAddMenu && (
            <div
              className="fixed bg-[#1a1f2e] border border-gray-700 rounded-xl shadow-2xl p-3 z-50"
              style={{ top: quickAddMenu.y - 10, left: quickAddMenu.x - 10 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-xs text-gray-500 mb-2 font-medium">Add node</div>
              <div className="grid grid-cols-4 gap-1">
                {QUICK_ADD_TYPES.map(({ type, category, Icon, label }) => (
                  <button
                    key={type}
                    title={label}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                    onClick={() => handleQuickAddNode(type, category, quickAddMenu.flowX, quickAddMenu.flowY)}
                  >
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-300">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Edge label editor */}
          {editingEdge && (
            <div
              className="fixed z-50 bg-[#1a1f2e] border border-blue-500 rounded shadow-2xl p-1"
              style={{ top: editingEdge.y, left: editingEdge.x, transform: "translate(-50%, -50%)" }}
              onClick={e => e.stopPropagation()}
            >
              <input
                autoFocus
                className="bg-transparent text-sm text-white px-2 py-1 outline-none min-w-[120px] text-center"
                value={editingEdge.label} placeholder="Edge label..."
                onChange={e => setEditingEdge({ ...editingEdge, label: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") saveEdgeLabel(); if (e.key === "Escape") setEditingEdge(null); }}
                onBlur={saveEdgeLabel}
              />
            </div>
          )}
        </div>

        <CodePanel isOpen={isCodePanelOpen} onClose={() => setIsCodePanelOpen(false)} nodes={nodes} edges={edges} onApply={handleApplyDSL} />
      </div>

      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        onApply={(newNodes, newEdges, dsl) => { handleApplyDSL(newNodes, newEdges); setTimeout(() => fitView({ duration: 800 }), 50); }}
        nodes={nodes}
        edges={edges}
      />

      <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSelectTemplate={handleApplyTemplate} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onCommand={handleCommandAction} savedDiagrams={savedDiagrams} />

      {/* Open diagram dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Open Diagram</DialogTitle>
            <DialogDescription className="text-gray-400">Select a saved diagram to load.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto">
            {savedDiagrams.length === 0
              ? <p className="text-gray-400 text-sm">No saved diagrams found.</p>
              : savedDiagrams.map(d => (
                <div key={d.id} className="p-3 border border-gray-800 rounded-md hover:bg-gray-800 cursor-pointer flex justify-between items-center transition-colors" onClick={() => handleLoad(d)}>
                  <span className="font-medium text-gray-200">{d.name}</span>
                  <span className="text-xs text-gray-500">{new Date(d.updatedAt).toLocaleDateString()}</span>
                </div>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Import JSON dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Diagram from JSON</DialogTitle>
            <DialogDescription className="text-gray-400">Paste diagram JSON (the format exported via Share).</DialogDescription>
          </DialogHeader>
          <textarea
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            placeholder={'{\n  "name": "My Diagram",\n  "nodes": [...],\n  "edges": [...]\n}'}
            className="mt-4 w-full h-48 bg-[#0f1117] border border-gray-700 rounded p-3 text-sm text-gray-200 font-mono outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors" onClick={() => setIsImportDialogOpen(false)}>Cancel</button>
            <button className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors" onClick={handleImportJson}>Import</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mermaid export modal */}
      <Dialog open={isMermaidModalOpen} onOpenChange={setIsMermaidModalOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mermaid Diagram Code</DialogTitle>
            <DialogDescription className="text-gray-400">Paste this into any Mermaid-compatible renderer (mermaid.live, Notion, GitHub, etc.).</DialogDescription>
          </DialogHeader>
          <pre className="mt-4 bg-[#0f1117] border border-gray-700 rounded p-4 text-sm text-gray-200 font-mono overflow-auto max-h-80 whitespace-pre-wrap">{mermaidCode}</pre>
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              onClick={() => { navigator.clipboard.writeText(mermaidCode); toast({ title: "Copied to clipboard" }); }}
            >Copy Again</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard shortcuts dialog */}
      <Dialog open={isShortcutsDialogOpen} onOpenChange={setIsShortcutsDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="text-gray-400">Work faster with these shortcuts.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {[
              { keys: ["Cmd", "K"], desc: "Command palette" },
              { keys: ["Ctrl", "F"], desc: "Find nodes by label" },
              { keys: ["Ctrl", "C"], desc: "Copy selected nodes" },
              { keys: ["Ctrl", "V"], desc: "Paste nodes" },
              { keys: ["Ctrl", "A"], desc: "Select all" },
              { keys: ["Ctrl", "S"], desc: "Save diagram" },
              { keys: ["Ctrl", "Z"], desc: "Undo" },
              { keys: ["Ctrl", "Y"], desc: "Redo" },
              { keys: ["Delete"], desc: "Delete selected" },
              { keys: ["Arrow keys"], desc: "Navigate between nodes" },
              { keys: ["Double-click", "canvas"], desc: "Quick-add node" },
              { keys: ["Right-click", "edge"], desc: "Edge style menu" },
              { keys: ["Escape"], desc: "Deselect / close menus" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 font-mono">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function DiagramEditor() {
  return (
    <ReactFlowProvider>
      <DiagramEditorInner />
    </ReactFlowProvider>
  );
}
