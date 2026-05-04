import { DrawFlowNode, DrawFlowEdge, NodeType, NodeCategory } from "../types";

export interface ParseResult {
  nodes: DrawFlowNode[];
  edges: DrawFlowEdge[];
  errors: string[];
}

const nodeCategories: Record<NodeType, NodeCategory> = {
  web: "frontend",
  mobile: "frontend",
  user: "frontend",
  api: "backend",
  service: "backend",
  worker: "backend",
  db: "data",
  cache: "data",
  dw: "data",
  queue: "data",
  stream: "data",
  external: "infra",
  metrics: "infra",
  text: "utils",
  box: "utils",
  circle: "utils",
  triangle: "utils"
};

export function parseDiagramDSL(dsl: string): ParseResult {
  const nodes: DrawFlowNode[] = [];
  const edges: DrawFlowEdge[] = [];
  const errors: string[] = [];

  const lines = dsl.split("\n");
  const nodeMap = new Map<string, boolean>();

  // Use auto-layout variables
  const colWidth = 220;
  const rowHeight = 150;
  const columns = 4;
  let nodeCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Try parsing as Edge: source_id -> target_id "Optional Label"
    const edgeMatch = line.match(/^(\w+)\s*->\s*(\w+)(?:\s+"([^"]*)")?$/);
    if (edgeMatch) {
      const [, source, target, label] = edgeMatch;
      
      edges.push({
        id: `e-${source}-${target}-${i}`,
        source,
        target,
        type: 'smoothstep',
        animated: true,
        label: label || undefined,
        markerEnd: {
          type: "arrowclosed" as any,
          width: 20,
          height: 20,
          color: '#8b949e',
        },
        style: { stroke: '#8b949e', strokeWidth: 2 },
        labelStyle: label ? { fill: '#d1d5db', fontWeight: 500, fontSize: 12 } : undefined,
        labelBgStyle: label ? { fill: '#1a1f2e', stroke: '#374151' } : undefined,
        labelBgPadding: label ? [6, 4] : undefined,
        labelBgBorderRadius: label ? 4 : undefined,
      });
      continue;
    }

    // Try parsing as Node: id [type] "Label"
    const nodeMatch = line.match(/^(\w+)\s+\[(\w+)\]\s+"([^"]*)"$/);
    if (nodeMatch) {
      const [, id, typeStr, label] = nodeMatch;
      const type = typeStr as NodeType;
      
      if (!nodeCategories[type]) {
        errors.push(`Line ${i + 1}: Invalid node type '${type}'`);
        continue;
      }

      if (nodeMap.has(id)) {
        errors.push(`Line ${i + 1}: Duplicate node id '${id}'`);
        continue;
      }

      const col = nodeCount % columns;
      const row = Math.floor(nodeCount / columns);
      
      nodes.push({
        id,
        type: "custom",
        position: { x: col * colWidth, y: row * rowHeight },
        data: {
          label,
          type,
          category: nodeCategories[type]
        }
      });
      nodeMap.set(id, true);
      nodeCount++;
      continue;
    }

    errors.push(`Line ${i + 1}: Syntax error`);
  }

  // Validate edges have valid source/target
  for (const edge of edges) {
    if (!nodeMap.has(edge.source)) {
      errors.push(`Edge references unknown source node '${edge.source}'`);
    }
    if (!nodeMap.has(edge.target)) {
      errors.push(`Edge references unknown target node '${edge.target}'`);
    }
  }

  return { nodes, edges, errors };
}
