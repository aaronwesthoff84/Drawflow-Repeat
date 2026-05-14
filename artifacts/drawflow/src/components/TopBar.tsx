import React from "react";
import {
  Plus, Save, FolderOpen, Share2,
  ZoomIn, ZoomOut, Maximize, PanelTopClose, PanelTopOpen,
  Undo2, Redo2, ImageDown, Keyboard, LayoutGrid,
  Grid3X3, AlignJustify, Crosshair, Ban, Magnet,
  Code2, Sparkles, NotebookPen, LayoutTemplate, Command,
  Monitor, FileInput, GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactFlow, BackgroundVariant } from "@xyflow/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportMermaid: () => void;
  onImport: () => void;
  onLayout: () => void;
  onShortcutsHelp: () => void;
  bgVariant: BackgroundVariant | "none";
  onCycleBgVariant: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  isCodePanelOpen: boolean;
  onToggleCodePanel: () => void;
  isAIPanelOpen: boolean;
  onToggleAIPanel: () => void;
  isNotesPanelOpen: boolean;
  onToggleNotesPanel: () => void;
  onOpenTemplates: () => void;
  onOpenCommandPalette: () => void;
  onTogglePresentation: () => void;
}

const bgIcons = {
  [BackgroundVariant.Dots]: Grid3X3,
  [BackgroundVariant.Lines]: AlignJustify,
  [BackgroundVariant.Cross]: Crosshair,
  none: Ban,
};

export function TopBar({
  name, setName, onNew, onSave, onLoad, onShare, onTogglePalette, isPaletteVisible,
  canUndo, canRedo, onUndo, onRedo, onExportPNG, onExportSVG, onExportMermaid, onImport,
  onLayout, onShortcutsHelp, bgVariant, onCycleBgVariant, snapToGrid, onToggleSnap,
  isCodePanelOpen, onToggleCodePanel, isAIPanelOpen, onToggleAIPanel,
  isNotesPanelOpen, onToggleNotesPanel, onOpenTemplates, onOpenCommandPalette,
  onTogglePresentation,
}: TopBarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const BgIcon = bgVariant ? bgIcons[bgVariant] : bgIcons.none;

  return (
    <div className="h-14 bg-[#1a1f2e] border-b border-[#2a3040] flex items-center justify-between px-4 shrink-0 z-10 relative">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <div className="bg-[#0f1117] border border-[#2a3040] px-3 py-1.5 rounded-full flex items-center gap-2 mr-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="text-sm font-semibold tracking-wide text-gray-200 hidden sm:inline">
            Draw<span className="text-gray-500 mx-1">→</span>Flow<span className="text-gray-500 mx-1">→</span>Repeat
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} className="text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} className="text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50" title="Redo (Ctrl+Y)">
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-[#2a3040] mx-1" />

          <Button variant="ghost" size="sm" onClick={onNew} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex">
            <Plus className="w-4 h-4 mr-2" /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={onLoad} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex">
            <FolderOpen className="w-4 h-4 mr-2" /> Open
          </Button>
          <Button variant="ghost" size="sm" onClick={onSave} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex" title="Save (Ctrl+S)">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onImport} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden lg:flex" title="Import from JSON">
            <FileInput className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenTemplates} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:flex" title="Templates">
            <LayoutTemplate className="w-4 h-4 mr-2" /> Templates
          </Button>
        </div>
      </div>

      {/* Center — diagram name */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="bg-transparent border border-transparent hover:border-[#2a3040] focus:border-blue-500/50 focus:bg-[#0f1117] rounded px-3 py-1 text-center font-medium outline-none transition-colors w-40 sm:w-64"
          placeholder="Diagram Name"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          onClick={onOpenCommandPalette}
          className="text-gray-400 hover:text-white hover:bg-gray-800 hidden lg:flex items-center gap-1 border border-gray-700 bg-[#0f1117]/50 rounded-md px-2 py-1 mr-2"
          title="Command Palette (Ctrl+K)"
        >
          <Command className="w-3 h-3" />
          <span className="text-xs font-mono">⌘K</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={onToggleNotesPanel} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${isNotesPanelOpen ? "bg-gray-800 text-white" : ""}`} title="Notes">
          <NotebookPen className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleCodePanel} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${isCodePanelOpen ? "bg-gray-800 text-white" : ""}`} title="Diagram as Code">
          <Code2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleAIPanel} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${isAIPanelOpen ? "bg-gray-800 text-purple-400" : ""}`} title="AI Diagram Generator">
          <Sparkles className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-[#2a3040] mx-1" />

        <Button variant="ghost" size="icon" onClick={onTogglePresentation} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Presentation Mode">
          <Monitor className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onLayout} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Auto Layout">
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleSnap} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${snapToGrid ? "bg-gray-800 text-blue-400" : ""}`} title="Snap to Grid">
          <Magnet className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onCycleBgVariant} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Toggle Background">
          <BgIcon className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-[#2a3040] mx-1" />

        <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fitView({ duration: 800 })} className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex" title="Fit View">
          <Maximize className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-[#2a3040] mx-1" />

        <Button variant="ghost" size="icon" onClick={onTogglePalette} className={`text-gray-300 hover:text-white hover:bg-gray-800 ${isPaletteVisible ? "bg-gray-800 text-white" : ""}`} title={isPaletteVisible ? "Hide Palette" : "Show Palette"}>
          {isPaletteVisible ? <PanelTopClose className="w-4 h-4" /> : <PanelTopOpen className="w-4 h-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800" title="Export">
              <ImageDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-gray-800 text-gray-200">
            <DropdownMenuItem onClick={onExportPNG} className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white">Export PNG</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSVG} className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white">Export SVG</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem onClick={onExportMermaid} className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
              <GitBranch className="w-3.5 h-3.5 mr-2 text-gray-500" /> Export Mermaid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare} className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
              <Share2 className="w-3.5 h-3.5 mr-2 text-gray-500" /> Copy JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={onShortcutsHelp} className="text-gray-300 hover:text-white hover:bg-gray-800" title="Keyboard Shortcuts">
          <Keyboard className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
