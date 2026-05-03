import React, { useState, useCallback, useRef } from "react";
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
  ReactFlowProvider,
  Panel,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";
import { TopBar } from "./TopBar";
import { Palette } from "./Palette";
import { DrawFlowNode, Diagram } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ 
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
    }, eds)),
    [setEdges]
  );

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

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleNew = () => {
    if (confirm("Are you sure you want to clear the canvas? Unsaved changes will be lost.")) {
      setNodes([]);
      setEdges([]);
      setDiagramName("Untitled Diagram");
      setDiagramId(crypto.randomUUID());
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
  };

  const handleShare = () => {
    const data = JSON.stringify({ nodes, edges, name: diagramName }, null, 2);
    navigator.clipboard.writeText(data);
    toast({
      title: "Copied to clipboard",
      description: "Diagram JSON data copied to clipboard.",
    });
  };

  const savedDiagrams = JSON.parse(localStorage.getItem("drawflow_diagrams") || "[]") as Diagram[];

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-white">
      <TopBar 
        name={diagramName} 
        setName={setDiagramName} 
        onNew={handleNew} 
        onSave={handleSave} 
        onLoad={() => setIsLoadDialogOpen(true)} 
        onShare={handleShare}
        onTogglePalette={() => setIsPaletteVisible(!isPaletteVisible)}
        isPaletteVisible={isPaletteVisible}
      />
      
      {isPaletteVisible && <Palette />}
      
      <div className="flex-1 w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#0f1117]"
        >
          <Background color="#333" gap={16} />
          <MiniMap 
            nodeColor={(n) => {
              return '#444';
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
            style={{ backgroundColor: '#1a1f2e' }}
          />
          <Controls className="bg-[#1a1f2e] border-gray-800 text-white fill-white" />
        </ReactFlow>
      </div>

      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Open Diagram</DialogTitle>
            <DialogDescription>
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
                  className="p-3 border border-gray-800 rounded-md hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                  onClick={() => handleLoad(d)}
                >
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-gray-400">{new Date(d.updatedAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
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
