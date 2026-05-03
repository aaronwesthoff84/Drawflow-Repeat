import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { 
  Globe, Smartphone, User, 
  Zap, Server, Cpu, 
  Database, Layers, BarChart2, List, Activity, 
  Globe2, LineChart, 
  Type, Square, Circle, Triangle,
  Palette, MessageSquareText
} from "lucide-react";
import { DrawFlowNodeData } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const icons = {
  web: Globe,
  mobile: Smartphone,
  user: User,
  api: Zap,
  service: Server,
  worker: Cpu,
  db: Database,
  cache: Layers,
  dw: BarChart2,
  queue: List,
  stream: Activity,
  external: Globe2,
  metrics: LineChart,
  text: Type,
  box: Square,
  circle: Circle,
  triangle: Triangle,
};

const defaultCategoryColors = {
  frontend: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  backend: "bg-green-500/10 border-green-500/30 text-green-400",
  data: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  infra: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  utils: "bg-gray-500/10 border-gray-500/30 text-gray-400",
};

const defaultCategoryHeaderColors = {
  frontend: "bg-blue-500/20 border-b border-blue-500/30 text-blue-400",
  backend: "bg-green-500/20 border-b border-green-500/30 text-green-400",
  data: "bg-amber-500/20 border-b border-amber-500/30 text-amber-400",
  infra: "bg-purple-500/20 border-b border-purple-500/30 text-purple-400",
  utils: "bg-gray-500/20 border-b border-gray-500/30 text-gray-400",
};

const PRESET_COLORS = [
  { name: "blue", value: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", header: "bg-blue-500/20 border-blue-500/30" },
  { name: "green", value: "#22c55e", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", header: "bg-green-500/20 border-green-500/30" },
  { name: "amber", value: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", header: "bg-amber-500/20 border-amber-500/30" },
  { name: "red", value: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", header: "bg-red-500/20 border-red-500/30" },
  { name: "purple", value: "#a855f7", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", header: "bg-purple-500/20 border-purple-500/30" },
  { name: "pink", value: "#ec4899", bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400", header: "bg-pink-500/20 border-pink-500/30" },
  { name: "cyan", value: "#06b6d4", bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", header: "bg-cyan-500/20 border-cyan-500/30" },
  { name: "gray", value: "#6b7280", bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", header: "bg-gray-500/20 border-gray-500/30" }
];

export const CustomNode = memo(({ id, data, isConnectable }: NodeProps<DrawFlowNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(!!data.notes);
  const { setNodes } = useReactFlow();

  const Icon = icons[data.type] || Square;
  const isShape = ["box", "circle", "triangle"].includes(data.type);
  const isText = data.type === "text";

  const handleDoubleClick = () => setIsEditing(true);
  const handleBlur = () => setIsEditing(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: e.target.value } } : n)));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, notes: e.target.value } } : n)));
  };

  const handleColorSelect = (colorValue: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, accentColor: colorValue } } : n)));
  };

  // Determine colors based on accentColor or category defaults
  const accentColorObj = PRESET_COLORS.find(c => c.value === data.accentColor);
  const baseClasses = accentColorObj 
    ? `${accentColorObj.bg} ${accentColorObj.border} ${accentColorObj.text}`
    : defaultCategoryColors[data.category];
    
  const headerClasses = accentColorObj
    ? `${accentColorObj.header} ${accentColorObj.text}`
    : defaultCategoryHeaderColors[data.category];

  const handleClass = accentColorObj
    ? accentColorObj.bg.replace('/10', '')
    : baseClasses.split(' ')[2].replace('text-', 'bg-');

  if (isText) {
    return (
      <div className="relative group">
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
        {isEditing ? (
          <input 
            value={data.label} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            autoFocus 
            className="bg-transparent border border-gray-500 rounded px-1 outline-none text-gray-300 min-w-[100px]"
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className={`font-medium px-2 py-1 min-w-[50px] min-h-[24px] cursor-text ${data.accentColor ? `text-[${data.accentColor}]` : 'text-gray-300'}`} style={{ color: data.accentColor }}>
            {data.label}
          </div>
        )}
        <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
      </div>
    );
  }

  if (isShape) {
    let shapeClass = "";
    if (data.type === "box") shapeClass = "rounded-md";
    if (data.type === "circle") shapeClass = "rounded-full";
    if (data.type === "triangle") {
      return (
        <div className="relative group flex items-center justify-center min-w-[100px] min-h-[100px]">
           <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400 -ml-2" />
           
           <div className={`absolute inset-0 w-0 h-0 border-l-[50px] border-l-transparent border-b-[86.6px] ${data.accentColor ? '' : 'border-b-gray-800'} border-r-[50px] border-r-transparent`} style={data.accentColor ? { borderBottomColor: data.accentColor } : {}}></div>
           
           <div className="z-10 mt-8">
             {isEditing ? (
               <input 
                 value={data.label} 
                 onChange={handleChange} 
                 onBlur={handleBlur} 
                 autoFocus 
                 className="bg-gray-900/80 border border-gray-500 rounded px-1 outline-none text-gray-300 w-[70px] text-center text-sm"
               />
             ) : (
               <div onDoubleClick={handleDoubleClick} className="text-gray-100 font-medium cursor-text text-sm max-w-[80px] text-center truncate">
                 {data.label}
               </div>
             )}
           </div>

           <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400 -mr-2" />
        </div>
      )
    }

    return (
      <div className={`relative group flex items-center justify-center min-w-[100px] min-h-[100px] bg-gray-800/80 border shadow-md ${shapeClass}`} style={data.accentColor ? { borderColor: data.accentColor, backgroundColor: `${data.accentColor}20` } : { borderColor: '#4b5563' }}>
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
        
        <div className="z-10 px-2">
          {isEditing ? (
            <input 
              value={data.label} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              autoFocus 
              className="bg-gray-900/80 border border-gray-500 rounded px-1 outline-none text-gray-300 w-full text-center text-sm"
            />
          ) : (
            <div onDoubleClick={handleDoubleClick} className="text-gray-100 font-medium cursor-text text-sm max-w-[120px] text-center truncate">
              {data.label}
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
      </div>
    );
  }

  // Standard cards
  return (
    <div className={`min-w-[180px] rounded-lg border bg-[#151923] shadow-lg overflow-hidden group ${baseClasses.split(' ')[1]}`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-2 h-4 rounded-sm -ml-1 ${handleClass}`} />
      
      <div className={`flex items-center justify-between px-3 py-2 border-b ${headerClasses}`}>
        <div className="flex items-center gap-2">
          <Icon size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">{data.type}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-black/20 rounded cursor-pointer" title="Change Color">
                <Palette size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-[#1a1f2e] border-gray-700" align="start">
              <div className="flex flex-wrap gap-1 w-[100px]">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.name}
                    className={`w-5 h-5 rounded-full border border-gray-600 hover:scale-110 transition-transform ${data.accentColor === color.value ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  />
                ))}
                <button
                  className={`w-5 h-5 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center hover:scale-110 transition-transform ${!data.accentColor ? 'ring-2 ring-white' : ''}`}
                  onClick={() => setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, accentColor: undefined } } : n))}
                  title="Default"
                >
                  <span className="text-[8px]">↺</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
          
          <button 
            className={`p-1 hover:bg-black/20 rounded cursor-pointer ${showNotes ? 'bg-black/20' : ''}`} 
            onClick={() => setShowNotes(!showNotes)}
            title="Notes"
          >
            <MessageSquareText size={12} />
          </button>
        </div>
      </div>
      
      <div className="p-3">
        {isEditing ? (
          <input 
            value={data.label} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            autoFocus 
            className="bg-[#0f1117] border border-gray-700 rounded px-2 py-1 outline-none text-white w-full text-sm"
            placeholder="Add label..."
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="text-gray-200 text-sm cursor-text min-h-[24px]">
            {data.label || <span className="text-gray-500 italic">Add label...</span>}
          </div>
        )}
        
        {showNotes && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <textarea
              className="w-full bg-[#0f1117]/50 border border-gray-700 rounded p-1.5 text-xs text-gray-300 min-h-[40px] resize-y outline-none focus:border-gray-500 placeholder-gray-600"
              placeholder="Add notes..."
              value={data.notes || ''}
              onChange={handleNotesChange}
              onKeyDown={(e) => e.stopPropagation()} // Prevent triggering global shortcuts
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-2 h-4 rounded-sm -mr-1 ${handleClass}`} />
    </div>
  );
});