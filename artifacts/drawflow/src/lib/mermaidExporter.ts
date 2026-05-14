import { DrawFlowNode, DrawFlowEdge } from "../types";

export function exportToMermaid(nodes: DrawFlowNode[], edges: DrawFlowEdge[]): string {
  let mermaid = "flowchart LR\n";

  nodes.forEach((node) => {
    const safeId = node.id.replace(/[^a-zA-Z0-9]/g, "n");
    const label = node.data.label.replace(/"/g, "'");
    let shape = `["${label}"]`;

    switch (node.data.type) {
      case "db":
        shape = `[("${label}")]`;
        break;
      case "cache":
        shape = `[["${label}"]]`;
        break;
      case "queue":
      case "stream":
        shape = `>"${label}"]`;
        break;
      case "metrics":
      case "circle":
        shape = `("${label}")`;
        break;
      default:
        shape = `["${label}"]`;
        break;
    }

    mermaid += `  ${safeId}${shape}\n`;
  });

  edges.forEach((edge) => {
    const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, "n");
    const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, "n");
    
    if (edge.label) {
      mermaid += `  ${sourceId} --> |"${edge.label}"| ${targetId}\n`;
    } else {
      mermaid += `  ${sourceId} --> ${targetId}\n`;
    }
  });

  return mermaid;
}
