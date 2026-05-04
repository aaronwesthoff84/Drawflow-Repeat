import React, { useState } from "react";
import { Sparkles, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseDiagramDSL } from "../lib/diagramParser";
import { DrawFlowNode, DrawFlowEdge } from "../types";

interface OllamaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (nodes: DrawFlowNode[], edges: DrawFlowEdge[], dsl: string) => void;
}

export function OllamaPanel({ isOpen, onClose, onApply }: OllamaPanelProps) {
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [model, setModel] = useState("llama3.2");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    try {
      setStatus("Testing connection...");
      setIsError(false);
      const res = await fetch(`${ollamaUrl}/api/tags`);
      if (res.ok) {
        setStatus("Connection successful!");
      } else {
        throw new Error("Failed to connect");
      }
    } catch (err: any) {
      setIsError(true);
      setStatus("Make sure Ollama is running with OLLAMA_ORIGINS=* or run: OLLAMA_ORIGINS=* ollama serve");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setStatus("Generating...");
    setIsError(false);
    
    const systemPrompt = `Generate a diagram DSL for the following system description. Use ONLY this exact syntax:

node_id [type] "Label"
source_id -> target_id "Edge Label"

Valid types: web, mobile, user, api, service, worker, db, cache, dw, queue, stream, external, metrics

Rules:
- node_id must be a single word with no spaces (use underscores)
- Every node must be defined before it is used in a connection
- Include 5-15 nodes and relevant connections
- Return ONLY the DSL code, no explanation, no markdown fences

User request: ${prompt}`;

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: systemPrompt,
          stream: false
        })
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = await res.json();
      let dsl = data.response;
      
      // Clean up markdown fences if model returned them anyway
      dsl = dsl.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
      
      const result = parseDiagramDSL(dsl);
      if (result.errors.length > 0) {
        setStatus(`Generated DSL had syntax errors: ${result.errors[0]}`);
        setIsError(true);
      } else {
        setStatus("Generation complete!");
        onApply(result.nodes, result.edges, dsl);
        toast({ title: "AI Diagram Generated", description: "Successfully parsed and applied to canvas." });
      }
    } catch (err: any) {
      setIsError(true);
      setStatus("Error connecting to Ollama. Make sure OLLAMA_ORIGINS=* is set.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-[280px] shrink-0 bg-[#1a1f2e] border-t border-[#2a3040] flex flex-col z-20 w-full relative">
      <div className="h-10 flex items-center justify-between px-4 border-b border-[#2a3040] shrink-0">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles size={16} />
          <span className="text-sm font-semibold tracking-wide">AI Diagram Generator</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Settings2 size={14} className="text-gray-500" />
            <input 
              value={ollamaUrl} 
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="bg-[#0f1117] border border-[#2a3040] rounded px-2 py-1 text-xs text-gray-300 w-48 outline-none focus:border-blue-500"
              placeholder="Ollama URL"
            />
            <input 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="bg-[#0f1117] border border-[#2a3040] rounded px-2 py-1 text-xs text-gray-300 w-32 outline-none focus:border-blue-500"
              placeholder="Model name"
            />
            <Button variant="secondary" size="sm" className="h-7 text-xs bg-[#2a3040] hover:bg-[#3a4050] text-gray-300 border-none" onClick={handleTestConnection}>
              Test Connection
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your system architecture, e.g. 'A web app with React frontend, Node.js API, PostgreSQL database, and Redis cache'"
            className="flex-1 bg-[#0f1117] border border-[#2a3040] rounded p-3 text-sm text-gray-200 outline-none focus:border-purple-500/50 resize-none transition-colors"
          />
          <div className="flex items-center justify-between shrink-0 mt-1">
            <span className={`text-xs ${isError ? 'text-red-400' : 'text-gray-500'}`}>{status}</span>
            <Button 
              className="bg-purple-600 hover:bg-purple-500 text-white border-none shadow-lg shadow-purple-900/20" 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Diagram
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
