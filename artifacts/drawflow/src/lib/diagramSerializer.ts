import { DrawFlowNode, DrawFlowEdge } from "../types";

export function serializeDiagram(nodes: DrawFlowNode[], edges: DrawFlowEdge[]): string {
  let dsl = "";

  if (nodes.length > 0) {
    dsl += "# Nodes\n";
    for (const node of nodes) {
      if (node.type === "custom") {
        // Using node id directly might be unsafe if it contains spaces or dashes. 
        // We'll clean it up to alphanumeric+underscore if it looks like a uuid, 
        // or just use it if it's already safe.
        // Actually, let's make sure the id is valid for DSL.
        let safeId = node.id.replace(/[^a-zA-Z0-9_]/g, "_");
        // If it starts with a number, prepend an underscore
        if (/^[0-9]/.test(safeId)) safeId = "_" + safeId;
        
        dsl += `${safeId} [${node.data.type}] "${node.data.label}"\n`;
      }
    }
    dsl += "\n";
  }

  if (edges.length > 0) {
    dsl += "# Connections\n";
    for (const edge of edges) {
      let safeSource = edge.source.replace(/[^a-zA-Z0-9_]/g, "_");
      if (/^[0-9]/.test(safeSource)) safeSource = "_" + safeSource;
      
      let safeTarget = edge.target.replace(/[^a-zA-Z0-9_]/g, "_");
      if (/^[0-9]/.test(safeTarget)) safeTarget = "_" + safeTarget;

      const labelStr = edge.label ? ` "${edge.label}"` : "";
      dsl += `${safeSource} -> ${safeTarget}${labelStr}\n`;
    }
  }

  return dsl.trim();
}
