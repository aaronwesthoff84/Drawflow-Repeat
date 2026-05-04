import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";
import { TopBar } from "./TopBar";
import { Palette } from "./Palette";
import { DrawFlowNode, Diagram } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHistory } from "../hooks/useHistory";
import { toPng, toSvg } from "html-to-image";
import { Workflow, Copy, Trash2, FileText } from "lucide-react";
import { CodePanel } from "./CodePanel";
import { OllamaPanel } from "./OllamaPanel";
import { NotesPanel } from "./NotesPanel";
import { CommandPalette } from "./CommandPalette";
import { TemplateModal } from "./TemplateModal";
import { parseDiagramDSL } from "../lib/diagramParser";

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: DrawFlowNode[] = [];
const initialEdges: Edge[] = [];

export function DiagramEditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [diagramName, setDiagramName] = useState("Untitled Diagram");
  const [diagramId, setDiagramId] = useState(crypto.randomUUID());
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { toast } = useToast();
  const { fitView, getNodes, getEdges } = useReactFlow();
  
  // Feature states
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant | "none">(BackgroundVariant.Dots);
  
  // New features
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // History Hook
  const { takeSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useHistory<DrawFlowNode, Edge>();
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: DrawFlowNode } | null>(null);
  
  // Edge Label Editing State
  const [editingEdge, setEditingEdge] = useState<{ id: string, label: string, x: number, y: number } | null>(null);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    const hasStructuralChanges = changes.some((c: any) => 
      c.type === 'remove' || c.type === 'add' || 
      (c.type === 'position' && !c.dragging && c.position)
    );
    if (hasStructuralChanges) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    }
  }, [onNodesChange, takeSnapshot, getNodes, getEdges]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    const hasStructuralChanges = changes.some((c: any) => c.type === 'remove' || c.type === 'add');
    if (hasStructuralChanges) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    }
  }, [onEdgesChange, takeSnapshot, getNodes, getEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setEdges((eds) => addEdge({ 
        ...params, 
        type: 'smoothstep', 
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#8b949e',
        },
        style: { stroke: '#8b949e', strokeWidth: 2 }
      }, eds));
    },
    [setEdges, takeSnapshot, getNodes, getEdges]
  );

  const handleUndo = useCallback(() => {
    const previous = undo(getNodes() as DrawFlowNode[], getEdges());
    if (previous) {
      setNodes(previous.nodes);
      setEdges(previous.edges);
    }
  }, [undo, getNodes, getEdges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const next = redo(getNodes() as DrawFlowNode[], getEdges());
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
    }
  }, [redo, getNodes, getEdges, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette on Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = getNodes().filter(n => n.selected);
        const selectedEdges = getEdges().filter(e => e.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
          setNodes(nds => nds.filter(n => !n.selected));
          setEdges(eds => eds.filter(e => !e.selected));
        }
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(e => ({ ...e, selected: true })));
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })));
        setContextMenu(null);
        setEditingEdge(null);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getNodes, getEdges, setNodes, setEdges, handleUndo, handleRedo, takeSnapshot]);


  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow/type");
      const category = event.dataTransfer.getData("application/reactflow/category");
      
      if (!type || !category) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: DrawFlowNode = {
        id: crypto.randomUUID(),
        type: "custom",
        position,
        data: { 
          label: `${type} node`,
          type: type as any,
          category: category as any
        },
      };

      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, takeSnapshot, getNodes, getEdges]
  );

  const handleNew = () => {
    if (confirm("Are you sure you want to clear the canvas? Unsaved changes will be lost.")) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setNodes([]);
      setEdges([]);
      setDiagramName("Untitled Diagram");
      setDiagramId(crypto.randomUUID());
      clearHistory();
    }
  };

  const handleSave = () => {
    const diagram: Diagram = {
      id: diagramId,
      name: diagramName,
      nodes,
      edges,
      updatedAt: new Date().toISOString()
    };
    
    const existingStr = localStorage.getItem("drawflow_diagrams");
    const existing: Diagram[] = existingStr ? JSON.parse(existingStr) : [];
    
    const updated = existing.filter(d => d.id !== diagramId);
    updated.push(diagram);
    
    localStorage.setItem("drawflow_diagrams", JSON.stringify(updated));
    toast({
      title: "Diagram saved",
      description: `Saved "${diagramName}" to local storage.`,
    });
  };

  const handleLoad = (diagram: Diagram) => {
    setNodes(diagram.nodes || []);
    setEdges(diagram.edges || []);
    setDiagramName(diagram.name);
    setDiagramId(diagram.id);
    setIsLoadDialogOpen(false);
    clearHistory();
  };

  const handleShare = () => {
    const data = JSON.stringify({ nodes, edges, name: diagramName }, null, 2);
    navigator.clipboard.writeText(data);
    toast({
      title: "Copied to clipboard",
      description: "Diagram JSON data copied to clipboard.",
    });
  };

  const handleExportPNG = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    
    const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;
    
    toast({ title: "Exporting PNG..." });
    
    fitView({ padding: 0.2 });
    
    setTimeout(() => {
      toPng(viewport, {
        backgroundColor: '#0f1117',
        pixelRatio: 2, 
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${diagramName.replace(/\s+/g, '_').toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "Export complete!" });
      })
      .catch((err) => {
        console.error("Failed to export png", err);
        toast({ title: "Export failed", variant: "destructive" });
      });
    }, 500); 
  }, [diagramName, fitView, toast]);

  const handleExportSVG = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    
    const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;
    
    toast({ title: "Exporting SVG..." });
    
    fitView({ padding: 0.2 });
    
    setTimeout(() => {
      toSvg(viewport, {
        backgroundColor: '#0f1117',
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${diagramName.replace(/\s+/g, '_').toLowerCase()}.svg`;
        link.href = dataUrl;
        link.click();
        toast({ title: "Export complete!" });
      })
      .catch((err) => {
        console.error("Failed to export svg", err);
        toast({ title: "Export failed", variant: "destructive" });
      });
    }, 500); 
  }, [diagramName, fitView, toast]);

  const handleLayout = useCallback(() => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    
    const categories = ["frontend", "backend", "data", "infra", "utils"];
    const layoutNodes = [...getNodes()] as DrawFlowNode[];
    
    const columnWidth = 220;
    const rowHeight = 150;
    
    let currentX = 0;
    
    categories.forEach((cat) => {
      const catNodes = layoutNodes.filter(n => n.data.category === cat);
      if (catNodes.length === 0) return;
      
      catNodes.forEach((node, index) => {
        node.position = {
          x: currentX,
          y: index * rowHeight
        };
      });
      
      currentX += columnWidth;
    });
    
    setNodes(layoutNodes);
    
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
  }, [getNodes, getEdges, setNodes, fitView, takeSnapshot]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        node: node as DrawFlowNode
      });
    },
    []
  );

  const handleDuplicateNode = useCallback((nodeToDuplicate: DrawFlowNode) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    const newNode: DrawFlowNode = {
      ...nodeToDuplicate,
      id: crypto.randomUUID(),
      position: { x: nodeToDuplicate.position.x + 20, y: nodeToDuplicate.position.y + 20 },
      selected: false
    };
    setNodes(nds => [...nds, newNode]);
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

  const handleCycleBgVariant = useCallback(() => {
    const variants: (BackgroundVariant | "none")[] = [BackgroundVariant.Dots, BackgroundVariant.Lines, BackgroundVariant.Cross, "none"];
    const currentIndex = variants.indexOf(bgVariant);
    const nextIndex = (currentIndex + 1) % variants.length;
    setBgVariant(variants[nextIndex]);
  }, [bgVariant]);

  const onEdgeDoubleClick = useCallback((evt: React.MouseEvent, edge: Edge) => {
    evt.stopPropagation();
    if (!reactFlowInstance) return;
    
    setEditingEdge({
      id: edge.id,
      label: (edge.label as string) || "",
      x: evt.clientX,
      y: evt.clientY
    });
  }, [reactFlowInstance]);

  const saveEdgeLabel = useCallback(() => {
    if (editingEdge) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setEdges(eds => eds.map(e => e.id === editingEdge.id ? { 
        ...e, 
        label: editingEdge.label,
        labelStyle: { fill: '#d1d5db', fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: '#1a1f2e', stroke: '#374151' },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
      } : e));
      setEditingEdge(null);
    }
  }, [editingEdge, setEdges, takeSnapshot, getNodes, getEdges]);

  const handleCommandAction = (action: string, payload?: any) => {
    switch (action) {
      case "NEW_DIAGRAM": handleNew(); break;
      case "SAVE_DIAGRAM": handleSave(); break;
      case "OPEN_DIAGRAM": setIsLoadDialogOpen(true); break;
      case "EXPORT_PNG": handleExportPNG(); break;
      case "EXPORT_SVG": handleExportSVG(); break;
      case "TOGGLE_CODE": setIsCodePanelOpen(!isCodePanelOpen); break;
      case "TOGGLE_AI": setIsAIPanelOpen(!isAIPanelOpen); break;
      case "TOGGLE_NOTES": setIsNotesPanelOpen(!isNotesPanelOpen); break;
      case "TOGGLE_PALETTE": setIsPaletteVisible(!isPaletteVisible); break;
      case "AUTO_LAYOUT": handleLayout(); break;
      case "FIT_VIEW": fitView({ duration: 800 }); break;
      case "TOGGLE_SNAP": setSnapToGrid(!snapToGrid); break;
      case "SHOW_SHORTCUTS": setIsShortcutsDialogOpen(true); break;
      case "CLEAR_CANVAS": handleNew(); break;
      case "LOAD_DIAGRAM": if (payload) handleLoad(payload); break;
      case "OPEN_TEMPLATES": setIsTemplateModalOpen(true); break;
    }
  };

  const handleApplyTemplate = (dsl: string) => {
    const result = parseDiagramDSL(dsl);
    if (result.errors.length === 0) {
      takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
      setNodes(result.nodes);
      setEdges(result.edges);
      setTimeout(() => fitView({ duration: 800 }), 50);
    } else {
      toast({ title: "Template parse error", variant: "destructive" });
    }
  };

  const handleApplyDSL = (newNodes: DrawFlowNode[], newEdges: DrawFlowEdge[]) => {
    takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
    
    // Preserve existing node positions where possible
    const existingPosMap = new Map();
    nodes.forEach(n => existingPosMap.set(n.id, n.position));

    const finalNodes = newNodes.map(n => {
      if (existingPosMap.has(n.id)) {
        return { ...n, position: existingPosMap.get(n.id) };
      }
      return n;
    });

    setNodes(finalNodes);
    setEdges(newEdges);
  };

  const savedDiagrams = JSON.parse(localStorage.getItem("drawflow_diagrams") || "[]") as Diagram[];
  const selectedNodes = nodes.filter(n => n.selected);

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-white overflow-hidden" onClick={() => { setContextMenu(null); if(editingEdge) saveEdgeLabel(); }}>
      <TopBar 
        name={diagramName} 
        setName={setDiagramName} 
        onNew={handleNew} 
        onSave={handleSave} 
        onLoad={() => setIsLoadDialogOpen(true)} 
        onShare={handleShare}
        onTogglePalette={() => setIsPaletteVisible(!isPaletteVisible)}
        isPaletteVisible={isPaletteVisible}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onLayout={handleLayout}
        onShortcutsHelp={() => setIsShortcutsDialogOpen(true)}
        bgVariant={bgVariant === "none" ? BackgroundVariant.Dots : bgVariant}
        onCycleBgVariant={handleCycleBgVariant}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        isCodePanelOpen={isCodePanelOpen}
        onToggleCodePanel={() => setIsCodePanelOpen(!isCodePanelOpen)}
        isAIPanelOpen={isAIPanelOpen}
        onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
        isNotesPanelOpen={isNotesPanelOpen}
        onToggleNotesPanel={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      
      {isPaletteVisible && <Palette />}
      
      <div className="flex flex-1 overflow-hidden relative">
        <NotesPanel 
          isOpen={isNotesPanelOpen} 
          onClose={() => setIsNotesPanelOpen(false)} 
          diagramId={diagramId}
        />

        <div className="flex-1 w-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={() => setContextMenu(null)}
            nodeTypes={nodeTypes}
            snapToGrid={snapToGrid}
            snapGrid={snapToGrid ? [20, 20] : undefined}
            fitView
            className="bg-[#0f1117]"
          >
            {bgVariant !== "none" && <Background variant={bgVariant} color="#333" gap={16} />}
            <MiniMap 
              nodeColor={(n) => {
                return n.data?.accentColor as string || '#444';
              }}
              maskColor="rgba(0, 0, 0, 0.7)"
              style={{ backgroundColor: '#1a1f2e' }}
            />
            <Controls className="bg-[#1a1f2e] border-gray-800 text-white fill-white" />

            {nodes.length === 0 && (
              <Panel position="center" className="pointer-events-none">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 backdrop-blur-sm">
                  <Workflow className="w-12 h-12 text-gray-500 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-300 mb-2">Start building your diagram</h2>
                  <p className="text-gray-500 text-sm max-w-sm text-center">Drag nodes from the palette above, or use auto-layout to get started</p>
                </div>
              </Panel>
            )}

            {selectedNodes.length > 0 && (
               <Panel position="top-center" className="mt-4 pointer-events-auto">
                 <div className="flex items-center gap-1 bg-[#1a1f2e] border border-gray-700 rounded-lg p-1.5 shadow-xl">
                   <div className="px-2 text-xs font-medium text-gray-400 border-r border-gray-700 mr-1">
                     {selectedNodes.length} selected
                   </div>
                   {selectedNodes.length === 1 && (
                     <button 
                       className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                       onClick={() => handleDuplicateNode(selectedNodes[0])}
                       title="Duplicate"
                     >
                       <Copy className="w-4 h-4" />
                     </button>
                   )}
                   <button 
                     className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors"
                     onClick={() => {
                       takeSnapshot(getNodes() as DrawFlowNode[], getEdges());
                       const selectedIds = new Set(selectedNodes.map(n => n.id));
                       setNodes(nds => nds.filter(n => !selectedIds.has(n.id)));
                       setEdges(eds => eds.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
                     }}
                     title="Delete"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </Panel>
            )}
          </ReactFlow>

          {contextMenu && (
            <div 
              className="absolute bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px] z-50"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b border-gray-800 mb-1">
                {contextMenu.node.data.label}
              </div>
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2 transition-colors"
                onClick={() => handleDuplicateNode(contextMenu.node)}
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2 transition-colors"
                onClick={() => handleAddNoteToNode(contextMenu.node.id)}
              >
                <FileText className="w-4 h-4" /> Add Note
              </button>
              <div className="my-1 border-t border-gray-800" />
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 transition-colors"
                onClick={() => handleDeleteNode(contextMenu.node.id)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}

          {editingEdge && (
            <div 
              className="absolute z-50 bg-[#1a1f2e] border border-blue-500 rounded shadow-2xl p-1"
              style={{ 
                top: editingEdge.y, 
                left: editingEdge.x,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input 
                autoFocus
                className="bg-transparent text-sm text-white px-2 py-1 outline-none min-w-[120px] text-center"
                value={editingEdge.label}
                placeholder="Edge label..."
                onChange={(e) => setEditingEdge({ ...editingEdge, label: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdgeLabel();
                  if (e.key === 'Escape') setEditingEdge(null);
                }}
                onBlur={saveEdgeLabel}
              />
            </div>
          )}
        </div>

        <CodePanel 
          isOpen={isCodePanelOpen} 
          onClose={() => setIsCodePanelOpen(false)}
          nodes={nodes}
          edges={edges}
          onApply={handleApplyDSL}
        />
      </div>

      <OllamaPanel 
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        onApply={(newNodes, newEdges) => {
          handleApplyDSL(newNodes, newEdges);
          setTimeout(() => fitView({ duration: 800 }), 50);
        }}
      />

      <TemplateModal 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCommand={handleCommandAction}
        savedDiagrams={savedDiagrams}
      />

      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Open Diagram</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a diagram to load from your browser's local storage.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto">
            {savedDiagrams.length === 0 ? (
              <p className="text-gray-400 text-sm">No saved diagrams found.</p>
            ) : (
              savedDiagrams.map(d => (
                <div 
                  key={d.id} 
                  className="p-3 border border-gray-800 rounded-md hover:bg-gray-800 cursor-pointer flex justify-between items-center transition-colors"
                  onClick={() => handleLoad(d)}
                >
                  <span className="font-medium text-gray-200">{d.name}</span>
                  <span className="text-xs text-gray-500">{new Date(d.updatedAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShortcutsDialogOpen} onOpenChange={setIsShortcutsDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="text-gray-400">
              Work faster with these global keyboard shortcuts.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {[
              { keys: ['Cmd', 'K'], desc: 'Open Command Palette' },
              { keys: ['Delete', 'Backspace'], desc: 'Delete selected nodes and edges' },
              { keys: ['Ctrl', 'A'], desc: 'Select all' },
              { keys: ['Ctrl', 'S'], desc: 'Save diagram' },
              { keys: ['Ctrl', 'Z'], desc: 'Undo' },
              { keys: ['Ctrl', 'Y'], desc: 'Redo' },
              { keys: ['Escape'], desc: 'Deselect all / Close menus' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 font-mono">
                      {k}
                    </kbd>
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
