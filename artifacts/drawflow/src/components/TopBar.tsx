import React from "react";
import { 
  Plus, Save, FolderOpen, Share2, 
  ZoomIn, ZoomOut, Maximize, PanelTopClose, PanelTopOpen,
  Undo2, Redo2, ImageDown, Keyboard, LayoutGrid,
  Grid3X3, AlignJustify, Crosshair, Ban, Magnet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactFlow, BackgroundVariant } from "@xyflow/react";

interface TopBarProps {
  name: string;
  setName: (name: string) => void;
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onTogglePalette: () => void;
  isPaletteVisible: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onLayout: () => void;
  onShortcutsHelp: () => void;
  bgVariant: BackgroundVariant | "none";
  onCycleBgVariant: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}

const bgIcons = {
  [BackgroundVariant.Dots]: Grid3X3,
  [BackgroundVariant.Lines]: AlignJustify,
  [BackgroundVariant.Cross]: Crosshair,
  none: Ban
};

export function TopBar({ 
  name, setName, onNew, onSave, onLoad, onShare, onTogglePalette, isPaletteVisible,
  canUndo, canRedo, onUndo, onRedo, onExport, onLayout, onShortcutsHelp,
  bgVariant, onCycleBgVariant, snapToGrid, onToggleSnap
}: TopBarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  const BgIcon = bgVariant ? bgIcons[bgVariant] : bgIcons.none;

  return (
    <div className="h-14 bg-[#1a1f2e] border-b border-[#2a3040] flex items-center justify-between px-4 shrink-0 z-10 relative">
      <div className="flex items-center gap-2">
        <div className="bg-[#0f1117] border border-[#2a3040] px-3 py-1.5 rounded-full flex items-center gap-2 mr-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span className="text-sm font-semibold tracking-wide text-gray-200 hidden sm:inline">Draw<span className="text-gray-500 mx-1">→</span>Flow<span className="text-gray-500 mx-1">→</span>Repeat</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} className="text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} className="text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50" title="Redo (Ctrl+Y)">
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-[#2a3040] mx-1"></div>

          <Button variant="ghost" size="sm" onClick={onNew} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex">
            <Plus className="w-4 h-4 mr-2" /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={onLoad} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex">
            <FolderOpen className="w-4 h-4 mr-2" /> Open
          </Button>
          <Button variant="ghost" size="sm" onClick={onSave} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex" title="Save (Ctrl+S)">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border border-transparent hover:border-[#2a3040] focus:border-blue-500/50 focus:bg-[#0f1117] rounded px-3 py-1 text-center font-medium outline-none transition-colors w-32 sm:w-64"
          placeholder="Diagram Name"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onLayout} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Auto Layout">
          <LayoutGrid className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={onToggleSnap} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${snapToGrid ? 'bg-gray-800 text-blue-400' : ''}`} title="Snap to Grid">
          <Magnet className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={onCycleBgVariant} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Toggle Background">
          <BgIcon className="w-4 h-4" />
        </Button>
        
        <div className="h-6 w-px bg-[#2a3040] mx-1"></div>

        <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fitView({ duration: 800 })} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex" title="Fit View">
          <Maximize className="w-4 h-4" />
        </Button>
        
        <div className="h-6 w-px bg-[#2a3040] mx-1"></div>
        
        <Button variant="ghost" size="icon" onClick={onTogglePalette} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${isPaletteVisible ? 'bg-gray-800 text-white' : ''}`} title={isPaletteVisible ? "Hide Palette" : "Show Palette"}>
          {isPaletteVisible ? <PanelTopClose className="w-4 h-4" /> : <PanelTopOpen className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onExport} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Export PNG">
          <ImageDown className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onShortcutsHelp} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Keyboard Shortcuts">
          <Keyboard className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}