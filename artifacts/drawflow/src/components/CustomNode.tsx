import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { 
  Globe, Smartphone, User, 
  Zap, Server, Cpu, 
  Database, Layers, BarChart2, List, Activity, 
  Globe2, LineChart, 
  Type, Square, Circle, Triangle,
  Diamond, Hexagon, Cylinder, CloudIcon,
  Palette, MessageSquareText, Lock, Unlock
} from "lucide-react";
import { DrawFlowNodeData } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const icons: Record<string, React.ElementType> = {
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
  diamond: Diamond,
  hexagon: Hexagon,
  cylinder: Cylinder,
  parallelogram: Square,
  cloud: CloudIcon,
  star: Square,
  oval: Circle,
};

const defaultCategoryColors = {
  frontend: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  backend: "bg-green-500/10 border-green-500/30 text-green-400",
  data: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  infra: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  utils: "bg-gray-500/10 border-gray-500/30 text-gray-400",
  shapes: "bg-gray-500/10 border-gray-500/30 text-gray-400",
};

const defaultCategoryHeaderColors = {
  frontend: "bg-blue-500/20 border-b border-blue-500/30 text-blue-400",
  backend: "bg-green-500/20 border-b border-green-500/30 text-green-400",
  data: "bg-amber-500/20 border-b border-amber-500/30 text-amber-400",
  infra: "bg-purple-500/20 border-b border-purple-500/30 text-purple-400",
  utils: "bg-gray-500/20 border-b border-gray-500/30 text-gray-400",
  shapes: "bg-gray-500/20 border-b border-gray-500/30 text-gray-400",
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

const SVG_SHAPES = ["triangle", "diamond", "hexagon", "cylinder", "parallelogram", "cloud", "star", "oval", "circle"];

function ShapeLabel({ isEditing, label, accentColor, handleDoubleClick, handleChange, handleBlur }: {
  isEditing: boolean; label: string; accentColor?: string;
  handleDoubleClick: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
}) {
  if (isEditing) {
    return <input value={label} onChange={handleChange} onBlur={handleBlur} autoFocus className="bg-gray-900/80 border border-gray-500 rounded px-1 outline-none text-gray-300 text-center text-sm w-[90px]" />;
  }
  return (
    <div onDoubleClick={handleDoubleClick} className="text-gray-100 font-medium cursor-text text-sm text-center max-w-[110px] truncate" style={accentColor ? { color: accentColor } : {}}>
      {label || <span className="text-gray-500 italic text-xs">label</span>}
    </div>
  );
}

function DiamondShape({ color, size = 100 }: { color?: string; size?: number }) {
  const s = size;
  const half = s / 2;
  return (
    <svg width={s + 4} height={s + 4} style={{ overflow: "visible" }}>
      <polygon
        points={`${half + 2},2 ${s + 2},${half + 2} ${half + 2},${s + 2} 2,${half + 2}`}
        fill={color ? `${color}20` : "#1f2937"}
        stroke={color || "#4b5563"}
        strokeWidth={1.5}
      />
    </svg>
  );
}

function HexagonShape({ color, w = 110, h = 80 }: { color?: string; w?: number; h?: number }) {
  const pad = 2;
  const cx = w / 2 + pad;
  const cy = h / 2 + pad;
  const rx = w / 2;
  const ry = h / 2;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg width={w + pad * 2} height={h + pad * 2} style={{ overflow: "visible" }}>
      <polygon points={pts} fill={color ? `${color}20` : "#1f2937"} stroke={color || "#4b5563"} strokeWidth={1.5} />
    </svg>
  );
}

function CylinderShape({ color, w = 110, h = 80 }: { color?: string; w?: number; h?: number }) {
  const rx = w / 2;
  const ry = 12;
  const pad = 2;
  const fillColor = color ? `${color}20` : "#1f2937";
  const strokeColor = color || "#4b5563";
  return (
    <svg width={w + pad * 2} height={h + pad * 2} style={{ overflow: "visible" }}>
      <rect x={pad} y={ry + pad} width={w} height={h - ry} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />
      <ellipse cx={rx + pad} cy={ry + pad} rx={rx} ry={ry} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />
      <path d={`M ${pad} ${ry + pad} Q ${rx + pad} ${ry * 2 + pad} ${w + pad} ${ry + pad}`} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />
    </svg>
  );
}

function ParallelogramShape({ color, w = 120, h = 60 }: { color?: string; w?: number; h?: number }) {
  const skew = 18;
  const pad = 2;
  const pts = `${skew + pad},${pad} ${w + pad},${pad} ${w - skew + pad},${h + pad} ${pad},${h + pad}`;
  return (
    <svg width={w + pad * 2} height={h + pad * 2} style={{ overflow: "visible" }}>
      <polygon points={pts} fill={color ? `${color}20` : "#1f2937"} stroke={color || "#4b5563"} strokeWidth={1.5} />
    </svg>
  );
}

function CloudShape({ color, w = 120, h = 80 }: { color?: string; w?: number; h?: number }) {
  const fillColor = color ? `${color}20` : "#1f2937";
  const strokeColor = color || "#4b5563";
  const pad = 4;
  const cx = w / 2 + pad;
  const cy = h / 2 + pad;
  const path = `M ${cx - 35},${cy + 20} 
    a 20,20 0 0 1 -5,-38 
    a 25,25 0 0 1 48,-5 
    a 20,20 0 0 1 2,43 z`;
  return (
    <svg width={w + pad * 2} height={h + pad * 2} style={{ overflow: "visible" }}>
      <path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />
    </svg>
  );
}

function StarShape({ color, size = 90 }: { color?: string; size?: number }) {
  const pad = 4;
  const cx = size / 2 + pad;
  const cy = size / 2 + pad;
  const outerR = size / 2;
  const innerR = size / 4;
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 180) * (36 * i - 90);
    const r = i % 2 === 0 ? outerR : innerR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg width={size + pad * 2} height={size + pad * 2} style={{ overflow: "visible" }}>
      <polygon points={points} fill={color ? `${color}20` : "#1f2937"} stroke={color || "#4b5563"} strokeWidth={1.5} />
    </svg>
  );
}

function OvalShape({ color, w = 130, h = 70 }: { color?: string; w?: number; h?: number }) {
  const pad = 2;
  return (
    <svg width={w + pad * 2} height={h + pad * 2} style={{ overflow: "visible" }}>
      <ellipse cx={w / 2 + pad} cy={h / 2 + pad} rx={w / 2} ry={h / 2} fill={color ? `${color}20` : "#1f2937"} stroke={color || "#4b5563"} strokeWidth={1.5} />
    </svg>
  );
}

export const CustomNode = memo(({ id, data: rawData, isConnectable }: NodeProps) => {
  const data = rawData as DrawFlowNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(!!data.notes);
  const { setNodes } = useReactFlow();

  const Icon = icons[data.type] || Square;
  const isSvgShape = SVG_SHAPES.includes(data.type);
  const isText = data.type === "text";
  const isBox = data.type === "box";
  const isLocked = !!data.locked;

  const handleDoubleClick = () => { if (isLocked) return; setIsEditing(true); };
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
  const handleToggleLock = () => {
    setNodes((nds) => nds.map((n) => n.id === id
      ? { ...n, draggable: !!n.data.locked, data: { ...n.data, locked: !n.data.locked } }
      : n
    ));
  };

  const accentColorObj = PRESET_COLORS.find(c => c.value === data.accentColor);
  const baseClasses = accentColorObj
    ? `${accentColorObj.bg} ${accentColorObj.border} ${accentColorObj.text}`
    : defaultCategoryColors[data.category] || defaultCategoryColors.utils;
  const headerClasses = accentColorObj
    ? `${accentColorObj.header} ${accentColorObj.text}`
    : defaultCategoryHeaderColors[data.category] || defaultCategoryHeaderColors.utils;
  const handleClass = accentColorObj
    ? accentColorObj.bg.replace('/10', '')
    : baseClasses.split(' ')[2]?.replace('text-', 'bg-') || "bg-gray-400";

  const sharedHandles = (
    <>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" style={{ left: "50%" }} />
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" style={{ left: "50%" }} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400" />
    </>
  );

  if (isText) {
    return (
      <div className={`relative group ${isLocked ? "opacity-80" : ""}`}>
        {sharedHandles}
        {isEditing ? (
          <input value={data.label} onChange={handleChange} onBlur={handleBlur} autoFocus className="bg-transparent border border-gray-500 rounded px-1 outline-none text-gray-300 min-w-[100px]" />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="font-medium px-2 py-1 min-w-[50px] min-h-[24px] cursor-text" style={{ color: data.accentColor || "#d1d5db" }}>
            {data.label}
          </div>
        )}
        {isLocked && <Lock className="absolute -top-2 -right-2 w-3 h-3 text-yellow-400" />}
      </div>
    );
  }

  if (isBox) {
    return (
      <div
        className={`relative group flex flex-col items-center justify-center min-w-[100px] min-h-[60px] bg-gray-800/80 border shadow-md rounded-md ${isLocked ? "opacity-80" : ""}`}
        style={data.accentColor ? { borderColor: data.accentColor, backgroundColor: `${data.accentColor}20` } : { borderColor: "#4b5563" }}
      >
        {sharedHandles}
        <div className="px-3 py-2">
          <ShapeLabel isEditing={isEditing} label={data.label} accentColor={data.accentColor} handleDoubleClick={handleDoubleClick} handleChange={handleChange} handleBlur={handleBlur} />
        </div>
        {isLocked && <Lock className="absolute top-1 right-1 w-3 h-3 text-yellow-400" />}
      </div>
    );
  }

  if (isSvgShape) {
    const renderShape = () => {
      const c = data.accentColor;
      if (data.type === "triangle") {
        return (
          <svg width={106} height={92} style={{ overflow: "visible" }}>
            <polygon points="53,2 104,90 2,90" fill={c ? `${c}20` : "#1f2937"} stroke={c || "#4b5563"} strokeWidth={1.5} />
          </svg>
        );
      }
      if (data.type === "circle") return <OvalShape color={c} w={90} h={90} />;
      if (data.type === "oval") return <OvalShape color={c} />;
      if (data.type === "diamond") return <DiamondShape color={c} />;
      if (data.type === "hexagon") return <HexagonShape color={c} />;
      if (data.type === "cylinder") return <CylinderShape color={c} />;
      if (data.type === "parallelogram") return <ParallelogramShape color={c} />;
      if (data.type === "cloud") return <CloudShape color={c} />;
      if (data.type === "star") return <StarShape color={c} />;
      return null;
    };

    return (
      <div className={`relative group flex items-center justify-center ${isLocked ? "opacity-80" : ""}`}>
        {sharedHandles}
        <div className="relative flex items-center justify-center">
          {renderShape()}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <ShapeLabel isEditing={isEditing} label={data.label} accentColor={data.accentColor} handleDoubleClick={handleDoubleClick} handleChange={handleChange} handleBlur={handleBlur} />
            </div>
          </div>
        </div>
        {isLocked && <Lock className="absolute top-0 right-0 w-3 h-3 text-yellow-400 z-20" />}
      </div>
    );
  }

  return (
    <div className={`min-w-[180px] rounded-lg border bg-[#151923] shadow-lg overflow-hidden group ${baseClasses.split(' ')[1]} ${isLocked ? "ring-1 ring-yellow-500/30" : ""}`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-2 h-4 rounded-sm -ml-1 ${handleClass}`} />
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-4 h-2 rounded-sm -mt-1 ${handleClass}`} style={{ left: "50%" }} />

      <div className={`flex items-center justify-between px-3 py-2 border-b ${headerClasses}`}>
        <div className="flex items-center gap-2">
          <Icon size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">{data.type}</span>
          {isLocked && <Lock size={10} className="text-yellow-400 ml-1" />}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className={`p-1 hover:bg-black/20 rounded cursor-pointer ${isLocked ? "text-yellow-400" : ""}`} onClick={handleToggleLock} title={isLocked ? "Unlock node" : "Lock node"}>
            {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-black/20 rounded cursor-pointer" title="Change Color">
                <Palette size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-[#1a1f2e] border-gray-700" align="start">
              <div className="flex flex-wrap gap-1 w-[100px]">
                {PRESET_COLORS.map(color => (
                  <button key={color.name} className={`w-5 h-5 rounded-full border border-gray-600 hover:scale-110 transition-transform ${data.accentColor === color.value ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: color.value }} onClick={() => handleColorSelect(color.value)} title={color.name} />
                ))}
                <button className={`w-5 h-5 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center hover:scale-110 transition-transform ${!data.accentColor ? 'ring-2 ring-white' : ''}`} onClick={() => setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, accentColor: undefined } } : n))} title="Default">
                  <span className="text-[8px]">↺</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <button className={`p-1 hover:bg-black/20 rounded cursor-pointer ${showNotes ? 'bg-black/20' : ''}`} onClick={() => setShowNotes(!showNotes)} title="Notes">
            <MessageSquareText size={12} />
          </button>
        </div>
      </div>

      <div className="p-3">
        {isEditing ? (
          <input value={data.label} onChange={handleChange} onBlur={handleBlur} autoFocus className="bg-[#0f1117] border border-gray-700 rounded px-2 py-1 outline-none text-white w-full text-sm" placeholder="Add label..." />
        ) : (
          <div onDoubleClick={handleDoubleClick} className={`text-gray-200 text-sm min-h-[24px] ${isLocked ? "" : "cursor-text"}`}>
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
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-2 h-4 rounded-sm -mr-1 ${handleClass}`} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className={`opacity-0 group-hover:opacity-100 transition-opacity w-4 h-2 rounded-sm -mb-1 ${handleClass}`} style={{ left: "50%" }} />
    </div>
  );
});
