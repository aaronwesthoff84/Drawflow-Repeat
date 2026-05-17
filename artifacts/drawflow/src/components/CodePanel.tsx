import React, { useState, useEffect, useRef } from "react";
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
  const parseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleChange = (val: string) => {
    setCode(val);
    isInternalChange.current = true;

    if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);
    parseTimeoutRef.current = setTimeout(() => {
      const result = parseDiagramDSL(val);
      setErrors(result.errors);
      if (result.errors.length === 0) {
        onApply(result.nodes, result.edges);
      }
    }, 600);
  };

  const handleManualApply = () => {
    const result = parseDiagramDSL(code);
    setErrors(result.errors);
    if (result.errors.length === 0) {
      isInternalChange.current = true;
      onApply(result.nodes, result.edges);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {
      textareaRef.current?.select();
      document.execCommand("copy");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = code.substring(0, start) + "  " + code.substring(end);
      setCode(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleManualApply();
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
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={handleCopy}
            title="Copy all (Ctrl+A then Ctrl+C also works)"
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={handleManualApply}
            title="Apply code (Ctrl+Enter)"
          >
            <Play size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-[#282c34]">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 w-full h-full resize-none bg-[#282c34] text-[#abb2bf] font-mono text-sm p-3 outline-none border-none leading-relaxed"
          placeholder={"# Paste or type DSL here\n# Example:\napi1 [api] \"My API\"\ndb1 [db] \"Database\"\napi1 -> db1 \"reads\""}
          style={{ minHeight: 0 }}
        />
      </div>

      <div className="shrink-0 px-3 py-1.5 border-t border-gray-800 bg-[#1a1f2e]">
        <p className="text-[10px] text-gray-500">
          Ctrl+Enter to apply &nbsp;·&nbsp; Ctrl+C / Ctrl+V to copy/paste &nbsp;·&nbsp; Tab for indent
        </p>
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
