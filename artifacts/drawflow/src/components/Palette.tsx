import React from "react";
import { 
  Globe, Smartphone, User, 
  Zap, Server, Cpu, 
  Database, Layers, BarChart2, List, Activity, 
  Globe2, LineChart, 
  Type, Square, Circle, Triangle,
  Diamond, Hexagon, Cylinder, Cloud,
  Star, Minus
} from "lucide-react";
import { NodeType, NodeCategory } from "../types";

const nodeCategories: { 
  id: NodeCategory; 
  name: string; 
  color: string;
  items: { type: NodeType; name: string; icon: React.ElementType }[] 
}[] = [
  {
    id: "frontend",
    name: "Frontend",
    color: "blue",
    items: [
      { type: "web", name: "Web", icon: Globe },
      { type: "mobile", name: "Mobile", icon: Smartphone },
      { type: "user", name: "User", icon: User },
    ]
  },
  {
    id: "backend",
    name: "Backend",
    color: "green",
    items: [
      { type: "api", name: "API", icon: Zap },
      { type: "service", name: "Service", icon: Server },
      { type: "worker", name: "Worker", icon: Cpu },
    ]
  },
  {
    id: "data",
    name: "Data",
    color: "amber",
    items: [
      { type: "db", name: "DB", icon: Database },
      { type: "cache", name: "Cache", icon: Layers },
      { type: "dw", name: "DW", icon: BarChart2 },
      { type: "queue", name: "Queue", icon: List },
      { type: "stream", name: "Stream", icon: Activity },
    ]
  },
  {
    id: "infra",
    name: "Infra",
    color: "purple",
    items: [
      { type: "external", name: "External", icon: Globe2 },
      { type: "metrics", name: "Metrics", icon: LineChart },
    ]
  },
  {
    id: "shapes",
    name: "Shapes",
    color: "gray",
    items: [
      { type: "text", name: "Text", icon: Type },
      { type: "box", name: "Box", icon: Square },
      { type: "circle", name: "Circle", icon: Circle },
      { type: "oval", name: "Oval", icon: Minus },
      { type: "triangle", name: "Triangle", icon: Triangle },
      { type: "diamond", name: "Diamond", icon: Diamond },
      { type: "hexagon", name: "Hexagon", icon: Hexagon },
      { type: "cylinder", name: "Cylinder", icon: Cylinder },
      { type: "parallelogram", name: "Parallelogram", icon: Square },
      { type: "cloud", name: "Cloud", icon: Cloud },
      { type: "star", name: "Star", icon: Star },
    ]
  }
];

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20",
};

export function Palette() {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType, category: NodeCategory) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.setData("application/reactflow/category", category);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="bg-[#151923] border-b border-[#2a3040] p-3 flex gap-6 overflow-x-auto overflow-y-hidden shrink-0 z-10">
      {nodeCategories.map((category) => (
        <div key={category.id} className="flex flex-col gap-2 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pl-1">
            {category.name}
          </div>
          <div className="flex gap-1.5 flex-wrap max-w-[260px]">
            {category.items.map((item) => (
              <div
                key={item.type}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded border cursor-grab active:cursor-grabbing transition-colors text-xs font-medium ${colorClasses[category.color as keyof typeof colorClasses]}`}
                draggable
                onDragStart={(e) => onDragStart(e, item.type, category.id)}
                title={item.name}
              >
                <item.icon size={13} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
