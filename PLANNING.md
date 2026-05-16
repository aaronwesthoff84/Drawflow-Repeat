# DrawFlow — Planning & Roadmap

This document lists planned improvements and feature ideas for DrawFlow.

---

## In Progress / Recently Completed

- [x] Transparent React Flow controls and pane background
- [x] Minimap show/hide toggle in toolbar
- [x] Editable edge waypoints (click to add, drag to move, × to delete individual points)
- [x] Edge delete button on hover
- [x] Expanded shape library (diamond, hexagon, cylinder, parallelogram, cloud, star, oval)
- [x] Connection handles on all four sides of nodes

---

## Suggested Next 20 Features

### 1. Shape Resize Handles
Allow nodes to be resized by dragging corner/edge handles. Especially useful for boxes, shapes, and group containers. React Flow supports `NodeResizer` — wire it in for shape-type nodes.

### 2. Group / Container Nodes
Add a "Group" node type that other nodes can be dragged inside. Groups act as visual containers with a label, collapsible behavior, and automatic resizing to fit children.

### 3. Edge Type Selector (per connection)
Right-click context menu option to switch an individual edge between bezier, straight, step, and smoothstep routing styles without losing waypoints.

### 4. Multi-Page / Tab Diagrams
Support multiple diagram pages within a single project file. Users can add tabs (e.g., "Overview", "Data Layer", "Auth Flow") and switch between them without losing state.

### 5. Real-Time Collaboration
WebSocket-based live cursors and shared editing so multiple users can work on the same diagram simultaneously. Could use a simple CRDT or operational transform approach.

### 6. Custom Node Icons / Image Upload
Let users upload a PNG/SVG logo and use it as a node's icon. Particularly useful for mapping real-world services (AWS, GCP, Stripe, etc.) onto diagram nodes.

### 7. Diagram Comments / Annotations
Sticky-note style comments that float above the canvas (not connected to any node). Support threading/replies for team review workflows.

### 8. Version History & Branching
Save named snapshots of the diagram (e.g., "v1.0 — initial design") and allow comparing or restoring any previous version. Works alongside the existing localStorage save system.

### 9. Import from Mermaid / PlantUML
Parse Mermaid.js or PlantUML syntax and render it as an editable React Flow diagram. Complements the existing Mermaid export.

### 10. Dark/Light Theme Toggle
Add a proper light mode with adjusted color tokens. Currently the app is dark-only. Persist preference in localStorage.

### 11. Custom Edge Labels with Rich Text
Allow edge labels to contain multi-line text, icons, or styled badges (e.g., HTTP method tags like GET / POST). Double-click opens a mini rich-text editor.

### 12. Connection Validation Rules
Allow users to define rules that prevent invalid connections (e.g., "DB can only connect to Service"). Show visual feedback when a connection attempt violates a rule.

### 13. Auto-Save to Cloud
Replace the localStorage-only persistence with optional cloud save via a backend API. Support user accounts (auth) and a diagram library page.

### 14. Diagram Diff / Change Tracking
Show a visual diff between two saved versions — added nodes in green, removed in red, changed edges highlighted. Useful for code-review style collaboration.

### 15. Keyboard Shortcut Customization
Let users remap keyboard shortcuts from a settings panel. Store bindings in localStorage.

### 16. Zoom-to-Selection
A toolbar button or keyboard shortcut that fits the viewport to only the currently selected nodes (rather than the whole diagram).

### 17. Path Animation Controls
Allow users to control edge animation speed, direction (reverse flow), and toggle animation on individual edges. Useful for showing data flow direction.

### 18. Minimap Click-to-Navigate
Make the minimap interactive so clicking or dragging on it pans the main canvas to that area.

### 19. Node Statistics Panel
A sidebar that shows diagram stats: total nodes, edges, nodes by category, most-connected node, orphaned nodes (no connections), etc.

### 20. Export to Confluence / Notion / Markdown
Generate an embeddable diagram for Confluence (XML), a Notion-compatible image block, or a Markdown file with a rendered PNG attached. Streamlines documentation workflows.

---

## Architecture Notes

- All diagram state is stored in React state (`useNodesState` / `useEdgesState`) and serialised to localStorage on save.
- Edge waypoints are stored in `edge.data.waypoints` as `{x, y}[]` and rendered by `EditableEdge.tsx`.
- Undo/redo is handled by a custom `useHistory` hook that snapshots node/edge arrays.
- The DSL parser (`lib/diagramParser.ts`) converts text descriptions to node/edge arrays.
- AI generation uses the AI panel to call a language model endpoint and parse the result as a diagram.

---

## Known Issues / Tech Debt

- Saved diagrams using `smoothstep` edge type won't render correctly after the migration to `editable` edges — need a migration shim in `handleLoad`.
- The triangle shape uses CSS borders rather than SVG, making it inconsistent with other SVG shapes.
- Node handles only appear on hover, which can be confusing for new users unfamiliar with React Flow's connection model.
