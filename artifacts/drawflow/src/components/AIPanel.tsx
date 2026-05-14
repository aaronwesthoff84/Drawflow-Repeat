import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, ChevronDown, RefreshCw, Download, Eye, Cpu, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseDiagramDSL } from "../lib/diagramParser";
import { serializeDiagram } from "../lib/diagramSerializer";
import { DrawFlowNode, DrawFlowEdge } from "../types";

type Provider = "ollama" | "openai" | "anthropic";
type Mode = "create" | "explain";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (nodes: DrawFlowNode[], edges: DrawFlowEdge[], dsl: string) => void;
  nodes: DrawFlowNode[];
  edges: DrawFlowEdge[];
}

const STORAGE = {
  provider: "drawflow_ai_provider",
  ollamaUrl: "drawflow_ollama_url",
  apiKey: (p: Provider) => `drawflow_api_key_${p}`,
  model: (p: Provider) => `drawflow_ai_model_${p}`,
};

const PROVIDER_META = {
  ollama: { label: "Ollama", badge: "Local", badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  openai: { label: "OpenAI", badge: "Cloud", badgeColor: "bg-green-500/20 text-green-400 border-green-500/30" },
  anthropic: { label: "Anthropic", badge: "Cloud", badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const DEFAULT_MODELS: Record<Provider, string> = {
  ollama: "llama3.2",
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-5",
};

const CREATE_SYSTEM_PROMPT = `You are a software architecture diagram generator.
Generate a diagram using ONLY this exact DSL syntax:

node_id [type] "Label"
source_id -> target_id "Edge Label"

Valid node types: web, mobile, user, api, service, worker, db, cache, dw, queue, stream, external, metrics, text, box, circle

Rules:
- node_id: single word, no spaces (use underscores), no hyphens
- Every node must be defined before being used in connections
- Include 5-15 nodes with relevant connections
- Return ONLY the DSL code — no markdown fences, no explanation, no commentary`;

const EXPLAIN_SYSTEM_PROMPT = `You are a senior software architect. Analyze the diagram DSL below and give a clear, structured explanation.

Cover:
1. What this system does (2-3 sentences)
2. Component breakdown (each node type and its role)
3. Key data flows and integration patterns
4. Potential concerns or architectural observations

Be concise and technical but accessible.`;

export function AIPanel({ isOpen, onClose, onApply, nodes, edges }: AIPanelProps) {
  const { toast } = useToast();

  const [provider, setProvider] = useState<Provider>(() =>
    (localStorage.getItem(STORAGE.provider) as Provider) || "ollama"
  );
  const [ollamaUrl, setOllamaUrl] = useState(() =>
    localStorage.getItem(STORAGE.ollamaUrl) || "http://localhost:11434"
  );
  const [apiKey, setApiKey] = useState(() =>
    localStorage.getItem(STORAGE.apiKey(provider)) || ""
  );
  const [model, setModel] = useState(() =>
    localStorage.getItem(STORAGE.model(provider)) || DEFAULT_MODELS[provider]
  );
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const [mode, setMode] = useState<Mode>("create");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"idle" | "error" | "success" | "info">("idle");
  const [explainText, setExplainText] = useState("");

  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState("");
  const [modelNotFound, setModelNotFound] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Sync storage on provider change
  useEffect(() => {
    localStorage.setItem(STORAGE.provider, provider);
    const savedKey = localStorage.getItem(STORAGE.apiKey(provider)) || "";
    const savedModel = localStorage.getItem(STORAGE.model(provider)) || DEFAULT_MODELS[provider];
    setApiKey(savedKey);
    setModel(savedModel);
    setAvailableModels([]);
    setModelsError("");
    setModelNotFound(false);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem(STORAGE.ollamaUrl, ollamaUrl);
  }, [ollamaUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE.apiKey(provider), apiKey);
  }, [apiKey, provider]);

  useEffect(() => {
    localStorage.setItem(STORAGE.model(provider), model);
  }, [model, provider]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError("");
    try {
      const params = new URLSearchParams({ provider, ollamaUrl, apiKey });
      const res = await fetch(`/api/ai/models?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch models" }));
        throw new Error(err.error || "Failed");
      }
      const data = await res.json() as { models: string[] };
      setAvailableModels(data.models);
      if (data.models.length > 0 && !data.models.includes(model)) {
        setModel(data.models[0]);
      }
    } catch (err: unknown) {
      setModelsError(err instanceof Error ? err.message : "Could not fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  }, [provider, ollamaUrl, apiKey, model]);

  // Auto-fetch models for anthropic (static) and when panel opens
  useEffect(() => {
    if (isOpen && provider === "anthropic") {
      fetchModels();
    }
  }, [isOpen, provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePullModel = async () => {
    setIsPulling(true);
    setPullProgress("Starting download...");
    try {
      const res = await fetch("/api/ai/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, ollamaUrl }),
      });
      if (!res.ok || !res.body) throw new Error("Pull failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line) as { status?: string; completed?: number; total?: number };
            if (json.status) {
              const pct = json.total ? ` (${Math.round((json.completed ?? 0) / json.total * 100)}%)` : "";
              setPullProgress(`${json.status}${pct}`);
            }
          } catch { /* skip malformed */ }
        }
      }
      setPullProgress("Download complete!");
      setModelNotFound(false);
      toast({ title: `Model "${model}" downloaded successfully` });
      await fetchModels();
    } catch (err: unknown) {
      setPullProgress("Download failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsPulling(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatus("Generating...");
    setStatusType("info");
    setExplainText("");
    setModelNotFound(false);

    const messages: Array<{ role: string; content: string }> = [];

    if (mode === "create") {
      messages.push({ role: "system", content: CREATE_SYSTEM_PROMPT });
      messages.push({ role: "user", content: prompt });
    } else {
      const dsl = serializeDiagram(nodes, edges);
      if (!dsl.trim()) {
        setStatus("No diagram on canvas to explain.");
        setStatusType("error");
        setIsGenerating(false);
        return;
      }
      messages.push({ role: "system", content: EXPLAIN_SYSTEM_PROMPT });
      messages.push({ role: "user", content: `Diagram DSL:\n\n${dsl}\n\nUser context: ${prompt || "Please explain this diagram."}` });
    }

    try {
      const res = await fetch("/api/ai/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, messages, apiKey, ollamaUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        const errText = err.error || "Unknown error";

        if (provider === "ollama" && errText.toLowerCase().includes("not found")) {
          setModelNotFound(true);
          setStatus(`Model "${model}" not found locally. Pull it below.`);
          setStatusType("error");
        } else {
          setStatus(`Error: ${errText}`);
          setStatusType("error");
        }
        return;
      }

      const data = await res.json() as { content: string };
      let content = data.content ?? "";

      if (mode === "create") {
        content = content.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();
        const result = parseDiagramDSL(content);
        if (result.errors.length > 0) {
          setStatus(`Generated DSL had errors: ${result.errors[0]}`);
          setStatusType("error");
        } else {
          onApply(result.nodes, result.edges, content);
          setStatus(`Generated ${result.nodes.length} nodes, ${result.edges.length} connections.`);
          setStatusType("success");
          toast({ title: "Diagram generated", description: `${result.nodes.length} nodes applied to canvas.` });
        }
      } else {
        setExplainText(content);
        setStatus("Explanation complete.");
        setStatusType("success");
      }
    } catch (err: unknown) {
      setStatus("Network error: " + (err instanceof Error ? err.message : "Unknown"));
      setStatusType("error");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const needsApiKey = provider !== "ollama";
  const StatusIcon =
    statusType === "error" ? AlertCircle :
    statusType === "success" ? CheckCircle2 :
    statusType === "info" ? Loader2 : null;

  return (
    <div className="shrink-0 bg-[#1a1f2e] border-t border-[#2a3040] flex flex-col z-20 w-full" style={{ height: 360 }}>
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-[#2a3040] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Sparkles size={14} />
            <span className="text-sm font-semibold">AI Assistant</span>
          </div>
          {/* Provider tabs */}
          <div className="flex items-center gap-0.5 bg-[#0f1117] rounded-md p-0.5 border border-[#2a3040]">
            {(["ollama", "openai", "anthropic"] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                  provider === p
                    ? "bg-[#2a3040] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {PROVIDER_META[p].label}
              </button>
            ))}
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PROVIDER_META[provider].badgeColor}`}>
            {PROVIDER_META[provider].badge}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left config column */}
        <div className="w-56 shrink-0 border-r border-[#2a3040] p-3 flex flex-col gap-3 overflow-y-auto">
          {/* Ollama URL */}
          {provider === "ollama" && (
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Ollama URL</label>
              <input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2a3040] rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
                placeholder="http://localhost:11434"
              />
            </div>
          )}
          {/* API Key */}
          {needsApiKey && (
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2a3040] rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
                placeholder={`${PROVIDER_META[provider].label} API key`}
              />
              <p className="text-[10px] text-gray-600 mt-1">Stored locally in browser</p>
            </div>
          )}

          {/* Model selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-gray-500 uppercase font-medium">Model</label>
              <button
                onClick={fetchModels}
                disabled={isLoadingModels}
                className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 disabled:opacity-50"
              >
                {isLoadingModels ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                Fetch
              </button>
            </div>

            <div className="relative" ref={modelDropdownRef}>
              <div className="flex gap-1">
                <input
                  value={model}
                  onChange={(e) => { setModel(e.target.value); setModelNotFound(false); }}
                  className="flex-1 min-w-0 bg-[#0f1117] border border-[#2a3040] rounded-l px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
                  placeholder="Model name"
                />
                {availableModels.length > 0 && (
                  <button
                    onClick={() => setShowModelDropdown(p => !p)}
                    className="bg-[#0f1117] border border-l-0 border-[#2a3040] rounded-r px-1.5 hover:bg-gray-800 transition-colors"
                  >
                    <ChevronDown size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
              {showModelDropdown && availableModels.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-[#1a1f2e] border border-[#2a3040] rounded mt-1 max-h-36 overflow-y-auto z-50 shadow-xl">
                  {availableModels.map((m) => (
                    <button
                      key={m}
                      className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-800 transition-colors ${m === model ? "text-blue-400" : "text-gray-300"}`}
                      onClick={() => { setModel(m); setShowModelDropdown(false); setModelNotFound(false); }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {modelsError && (
              <p className="text-[10px] text-red-400 mt-1">{modelsError}</p>
            )}
            {provider === "ollama" && availableModels.length === 0 && !modelsError && (
              <p className="text-[10px] text-gray-600 mt-1">Click Fetch to load available models</p>
            )}
          </div>

          {/* Ollama pull */}
          {modelNotFound && provider === "ollama" && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
              <p className="text-[10px] text-orange-400 mb-2">Model not found locally. Pull from Ollama registry?</p>
              <button
                onClick={handlePullModel}
                disabled={isPulling}
                className="w-full flex items-center justify-center gap-1.5 text-xs bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 rounded py-1 transition-colors disabled:opacity-60"
              >
                {isPulling ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {isPulling ? "Pulling..." : `Pull ${model}`}
              </button>
              {pullProgress && <p className="text-[10px] text-gray-400 mt-1.5 truncate">{pullProgress}</p>}
            </div>
          )}

          {/* Mode selector */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-medium mb-1 block">Mode</label>
            <div className="flex gap-1">
              <button
                onClick={() => setMode("create")}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors ${
                  mode === "create" ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "bg-[#0f1117] text-gray-500 hover:text-gray-300 border border-[#2a3040]"
                }`}
              >
                <Cpu size={11} /> Create
              </button>
              <button
                onClick={() => setMode("explain")}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors ${
                  mode === "explain" ? "bg-blue-600/30 text-blue-300 border border-blue-500/30" : "bg-[#0f1117] text-gray-500 hover:text-gray-300 border border-[#2a3040]"
                }`}
              >
                <Eye size={11} /> Explain
              </button>
            </div>
          </div>
        </div>

        {/* Right prompt + output column */}
        <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden min-w-0">
          {/* Explain output */}
          {mode === "explain" && explainText ? (
            <div className="flex-1 overflow-y-auto bg-[#0f1117] border border-[#2a3040] rounded p-3 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
              {explainText}
            </div>
          ) : (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
              }}
              placeholder={
                mode === "create"
                  ? "Describe your system, e.g. 'A React SPA backed by Node.js API, PostgreSQL database, Redis cache, deployed on AWS with a CDN'\n\n(Ctrl+Enter to generate)"
                  : "Add context or questions about the diagram, or leave blank for a general explanation\n\n(Ctrl+Enter to explain)"
              }
              className="flex-1 bg-[#0f1117] border border-[#2a3040] rounded p-3 text-sm text-gray-200 outline-none focus:border-purple-500/50 resize-none transition-colors placeholder-gray-600"
            />
          )}

          {/* Status + actions */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {StatusIcon && (
                <StatusIcon
                  size={13}
                  className={`shrink-0 ${
                    statusType === "error" ? "text-red-400" :
                    statusType === "success" ? "text-green-400" :
                    statusType === "info" ? "text-blue-400 animate-spin" : "text-gray-500"
                  }`}
                />
              )}
              {status && <span className={`text-xs truncate ${statusType === "error" ? "text-red-400" : statusType === "success" ? "text-green-400" : "text-gray-500"}`}>{status}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {mode === "explain" && explainText && (
                <button
                  onClick={() => { setExplainText(""); setStatus(""); setStatusType("idle"); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
              <Button
                className={`text-white border-none shadow-lg ${
                  mode === "create"
                    ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                }`}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                size="sm"
              >
                {isGenerating ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Working...</>
                ) : mode === "create" ? (
                  <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate</>
                ) : (
                  <><Eye className="w-3.5 h-3.5 mr-1.5" /> Explain</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
