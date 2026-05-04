import React, { useState, useEffect } from "react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";
import { Diagram } from "../types";
import { FilePlus, Save, FolderOpen, ImageDown, Code2, Sparkles, LayoutGrid, Maximize, Magnet, PanelTop, Keyboard, Trash2, LayoutTemplate, NotebookPen } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (action: string, payload?: any) => void;
  savedDiagrams: Diagram[];
}

export function CommandPalette({ isOpen, onClose, onCommand, savedDiagrams }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onCommand("OPEN_COMMAND_PALETTE"); // We don't trigger this here, parent handles state
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose, onCommand]);

  const runCommand = (action: string, payload?: any) => {
    onCommand(action, payload);
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose} label="Global Command Palette">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand("NEW_DIAGRAM")}><FilePlus className="mr-2 h-4 w-4" /> New Diagram</CommandItem>
          <CommandItem onSelect={() => runCommand("SAVE_DIAGRAM")}><Save className="mr-2 h-4 w-4" /> Save Diagram</CommandItem>
          <CommandItem onSelect={() => runCommand("OPEN_DIAGRAM")}><FolderOpen className="mr-2 h-4 w-4" /> Open Diagram...</CommandItem>
          <CommandItem onSelect={() => runCommand("EXPORT_PNG")}><ImageDown className="mr-2 h-4 w-4" /> Export PNG</CommandItem>
          <CommandItem onSelect={() => runCommand("EXPORT_SVG")}><ImageDown className="mr-2 h-4 w-4" /> Export SVG</CommandItem>
          <CommandItem onSelect={() => runCommand("OPEN_TEMPLATES")}><LayoutTemplate className="mr-2 h-4 w-4" /> Templates...</CommandItem>
          <CommandItem onSelect={() => runCommand("CLEAR_CANVAS")}><Trash2 className="mr-2 h-4 w-4" /> Clear Canvas</CommandItem>
        </CommandGroup>

        <CommandGroup heading="Panels">
          <CommandItem onSelect={() => runCommand("TOGGLE_CODE")}><Code2 className="mr-2 h-4 w-4" /> Toggle Diagram as Code</CommandItem>
          <CommandItem onSelect={() => runCommand("TOGGLE_AI")}><Sparkles className="mr-2 h-4 w-4" /> Toggle AI Generator</CommandItem>
          <CommandItem onSelect={() => runCommand("TOGGLE_NOTES")}><NotebookPen className="mr-2 h-4 w-4" /> Toggle Notes Panel</CommandItem>
          <CommandItem onSelect={() => runCommand("TOGGLE_PALETTE")}><PanelTop className="mr-2 h-4 w-4" /> Toggle Palette</CommandItem>
        </CommandGroup>

        <CommandGroup heading="View">
          <CommandItem onSelect={() => runCommand("AUTO_LAYOUT")}><LayoutGrid className="mr-2 h-4 w-4" /> Auto Layout</CommandItem>
          <CommandItem onSelect={() => runCommand("FIT_VIEW")}><Maximize className="mr-2 h-4 w-4" /> Fit View</CommandItem>
          <CommandItem onSelect={() => runCommand("TOGGLE_SNAP")}><Magnet className="mr-2 h-4 w-4" /> Toggle Snap to Grid</CommandItem>
          <CommandItem onSelect={() => runCommand("SHOW_SHORTCUTS")}><Keyboard className="mr-2 h-4 w-4" /> Keyboard Shortcuts</CommandItem>
        </CommandGroup>

        {savedDiagrams.length > 0 && (
          <CommandGroup heading="Recent Diagrams">
            {savedDiagrams.map(d => (
              <CommandItem key={d.id} onSelect={() => runCommand("LOAD_DIAGRAM", d)}>
                <FolderOpen className="mr-2 h-4 w-4 text-gray-500" /> {d.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
