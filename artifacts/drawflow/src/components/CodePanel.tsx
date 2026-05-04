import React, { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { parseDiagramDSL } from "../lib/diagramParser";
import { serializeDiagram } from "../lib/diagramSerializer";
import { DrawFlowNode, DrawFlowEdge } from "../types";
import { X, Play, Copy, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: DrawFlowNode[];
  edges: DrawFlowEdge[];
  onApply: (nodes: DrawFlowNode[], edges: DrawFlowEdge[]) => void;
}

export function CodePanel({ isOpen, onClose, nodes, edges, onApply }: CodePanelProps) {
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const isInternalChange = useRef(false);

  // Sync canvas -> code
  useEffect(() => {
    if (!isOpen || isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const dsl = serializeDiagram(nodes, edges);
      setCode(dsl);
      setErrors([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [nodes, edges, isOpen]);

  const handleChange = (val: string) => {
    setCode(val);
    isInternalChange.current = true;
    
    // Auto-parse on debounce
    clearTimeout((window as any).parseTimeout);
    (window as any).parseTimeout = setTimeout(() => {
      const result = parseDiagramDSL(val);
      setErrors(result.errors);
      if (result.errors.length === 0) {
        onApply(result.nodes, result.edges);
      }
    }, 400);
  };

  const handleManualApply = () => {
    const result = parseDiagramDSL(code);
    setErrors(result.errors);
    if (result.errors.length === 0) {
      isInternalChange.current = true;
      onApply(result.nodes, result.edges);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[380px] shrink-0 bg-[#1a1f2e] border-l border-gray-800 flex flex-col h-full z-10">
      <div className="h-10 flex items-center justify-between px-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-gray-200">
          <FileCode2 size={14} />
          <span className="text-sm font-medium">Diagram as Code</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={handleManualApply} title="Apply Code">
            <Play size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-[#282c34] flex flex-col">
        <CodeMirror
          value={code}
          height="100%"
          theme={oneDark}
          onChange={handleChange}
          className="flex-1 text-sm text-left"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="shrink-0 max-h-32 overflow-y-auto bg-red-950/40 border-t border-red-900/50 p-2">
          {errors.map((err, i) => (
            <div key={i} className="text-xs text-red-400 font-mono mb-1">{err}</div>
          ))}
        </div>
      )}
    </div>
  );
}
