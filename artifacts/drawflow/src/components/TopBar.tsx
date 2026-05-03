import React from "react";
import { 
  Plus, Save, FolderOpen, Share2, 
  ZoomIn, ZoomOut, Maximize, PanelTopClose, PanelTopOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactFlow } from "@xyflow/react";

interface TopBarProps {
  name: string;
  setName: (name: string) => void;
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onTogglePalette: () => void;
  isPaletteVisible: boolean;
}

export function TopBar({ 
  name, setName, onNew, onSave, onLoad, onShare, onTogglePalette, isPaletteVisible 
}: TopBarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="h-14 bg-[#1a1f2e] border-b border-[#2a3040] flex items-center justify-between px-4 shrink-0 z-10 relative">
      <div className="flex items-center gap-4">
        <div className="bg-[#0f1117] border border-[#2a3040] px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span className="text-sm font-semibold tracking-wide text-gray-200">Draw<span className="text-gray-500 mx-1">→</span>Flow<span className="text-gray-500 mx-1">→</span>Repeat</span>
        </div>

        <div className="h-6 w-px bg-[#2a3040] mx-1"></div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onNew} className="text-gray-300 hover:text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={onLoad} className="text-gray-300 hover:text-white hover:bg-gray-800">
            <FolderOpen className="w-4 h-4 mr-2" /> Open
          </Button>
          <Button variant="ghost" size="sm" onClick={onSave} className="text-gray-300 hover:text-white hover:bg-gray-800">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare} className="text-gray-300 hover:text-white hover:bg-gray-800">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border border-transparent hover:border-[#2a3040] focus:border-blue-500/50 focus:bg-[#0f1117] rounded px-3 py-1 text-center font-medium outline-none transition-colors w-64"
          placeholder="Diagram Name"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fitView()} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Fit View">
          <Maximize className="w-4 h-4" />
        </Button>
        
        <div className="h-6 w-px bg-[#2a3040] mx-1"></div>
        
        <Button variant="ghost" size="icon" onClick={onTogglePalette} className="text-gray-300 hover:text-white hover:bg-gray-800" title={isPaletteVisible ? "Hide Palette" : "Show Palette"}>
          {isPaletteVisible ? <PanelTopClose className="w-4 h-4" /> : <PanelTopOpen className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
