import { Node, Edge } from "@xyflow/react";

export type NodeType = 
  | "web" | "mobile" | "user" 
  | "api" | "service" | "worker" 
  | "db" | "cache" | "dw" | "queue" | "stream" 
  | "external" | "metrics" 
  | "text" | "box" | "circle" | "triangle";

export type NodeCategory = "frontend" | "backend" | "data" | "infra" | "utils";

export interface DrawFlowNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  category: NodeCategory;
  accentColor?: string;
  notes?: string;
  locked?: boolean;
}

export type DrawFlowNode = Node<DrawFlowNodeData, "custom">;
export type DrawFlowEdge = Edge;

export interface Diagram {
  id: string;
  name: string;
  nodes: DrawFlowNode[];
  edges: DrawFlowEdge[];
  updatedAt: string;
}
