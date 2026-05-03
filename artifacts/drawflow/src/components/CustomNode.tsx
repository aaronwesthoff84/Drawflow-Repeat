import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { 
  Globe, Smartphone, User, 
  Zap, Server, Cpu, 
  Database, Layers, BarChart2, List, Activity, 
  Globe2, LineChart, 
  Type, Square, Circle, Triangle 
} from "lucide-react";
import { DrawFlowNodeData } from "../types";

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

const categoryColors = {
  frontend: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  backend: "bg-green-500/10 border-green-500/30 text-green-400",
  data: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  infra: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  utils: "bg-gray-500/10 border-gray-500/30 text-gray-400",
};

const categoryHeaderColors = {
  frontend: "bg-blue-500/20 border-b border-blue-500/30 text-blue-400",
  backend: "bg-green-500/20 border-b border-green-500/30 text-green-400",
  data: "bg-amber-500/20 border-b border-amber-500/30 text-amber-400",
  infra: "bg-purple-500/20 border-b border-purple-500/30 text-purple-400",
  utils: "bg-gray-500/20 border-b border-gray-500/30 text-gray-400",
};

export const CustomNode = memo(({ data, isConnectable }: NodeProps<DrawFlowNodeData>) => {
  const [label, setLabel] = useState(data.label);
  const [isEditing, setIsEditing] = useState(false);

  const Icon = icons[data.type] || Square;
  const isUtil = data.category === "utils";
  const isShape = ["box", "circle", "triangle"].includes(data.type);
  const isText = data.type === "text";

  const handleDoubleClick = () => setIsEditing(true);
  const handleBlur = () => setIsEditing(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    // In a real app, we'd update the node data via React Flow's setNodes or internal data object
  };

  if (isText) {
    return (
      <div className="relative group">
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
        {isEditing ? (
          <input 
            value={label} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            autoFocus 
            className="bg-transparent border border-gray-500 rounded px-1 outline-none text-gray-300 min-w-[100px]"
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="text-gray-300 font-medium px-2 py-1 min-w-[50px] min-h-[24px] cursor-text">
            {label}
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
           
           <div className="absolute inset-0 w-0 h-0 border-l-[50px] border-l-transparent border-b-[86.6px] border-b-gray-800 border-r-[50px] border-r-transparent"></div>
           
           <div className="z-10 mt-8">
             {isEditing ? (
               <input 
                 value={label} 
                 onChange={handleChange} 
                 onBlur={handleBlur} 
                 autoFocus 
                 className="bg-gray-900/80 border border-gray-500 rounded px-1 outline-none text-gray-300 w-[70px] text-center text-sm"
               />
             ) : (
               <div onDoubleClick={handleDoubleClick} className="text-gray-300 font-medium cursor-text text-sm max-w-[80px] text-center truncate">
                 {label}
               </div>
             )}
           </div>

           <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400 -mr-2" />
        </div>
      )
    }

    return (
      <div className={`relative group flex items-center justify-center min-w-[100px] min-h-[100px] bg-gray-800/80 border border-gray-600 shadow-md ${shapeClass}`}>
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
        
        <div className="z-10 px-2">
          {isEditing ? (
            <input 
              value={label} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              autoFocus 
              className="bg-gray-900/80 border border-gray-500 rounded px-1 outline-none text-gray-300 w-full text-center text-sm"
            />
          ) : (
            <div onDoubleClick={handleDoubleClick} className="text-gray-300 font-medium cursor-text text-sm max-w-[120px] text-center truncate">
              {label}
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
      </div>
    );
  }

  // Standard cards
  return (
    <div className={`min-w-[180px] rounded-lg border bg-[#151923] shadow-lg overflow-hidden group ${categoryColors[data.category].split(' ')[1]}`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-2 h-4 rounded-sm -ml-1 ${categoryColors[data.category].split(' ')[2].replace('text-', 'bg-')}`} />
      
      <div className={`flex items-center gap-2 px-3 py-2 ${categoryHeaderColors[data.category]}`}>
        <Icon size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">{data.type}</span>
      </div>
      
      <div className="p-3">
        {isEditing ? (
          <input 
            value={label} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            autoFocus 
            className="bg-[#0f1117] border border-gray-700 rounded px-2 py-1 outline-none text-white w-full text-sm"
            placeholder="Add label..."
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="text-gray-200 text-sm cursor-text min-h-[24px]">
            {label || <span className="text-gray-500 italic">Add label...</span>}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-2 h-4 rounded-sm -mr-1 ${categoryColors[data.category].split(' ')[2].replace('text-', 'bg-')}`} />
    </div>
  );
});
