import React, { useState, useEffect } from "react";
import { X, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
}

export function NotesPanel({ isOpen, onClose, diagramId }: NotesPanelProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!diagramId) return;
    const saved = localStorage.getItem(`drawflow_notes_${diagramId}`);
    if (saved) setNotes(saved);
    else setNotes("");
  }, [diagramId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem(`drawflow_notes_${diagramId}`, val);
  };

  if (!isOpen) return null;

  return (
    <div className="w-[220px] shrink-0 bg-[#1a1f2e] border-r border-gray-800 flex flex-col h-full">
      <div className="h-10 flex items-center justify-between px-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-gray-200">
          <NotebookPen size={14} />
          <span className="text-sm font-medium">Notes</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
      
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-hidden">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Add markdown notes here..."
          className="flex-1 bg-[#0f1117] border border-gray-800 rounded-md p-2 text-sm text-gray-300 resize-none outline-none focus:border-gray-600 transition-colors"
        />
        <div className="flex-1 bg-[#0f1117] border border-gray-800 rounded-md p-2 overflow-y-auto">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Preview</div>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{notes || <span className="text-gray-600 italic">No notes yet.</span>}</pre>
        </div>
      </div>
    </div>
  );
}
