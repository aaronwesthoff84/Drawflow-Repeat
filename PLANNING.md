# DrawFlow — Planning & Roadmap

---

## Known Issues / Tech Debt

These are tracked issues that need to be addressed before or alongside feature work to avoid compounding problems.

- **Edge migration shim:** Saved diagrams that used the old `smoothstep` edge type won't render correctly after the migration to `editable` edges. Need a backward-compat shim in `handleLoad` that upgrades old edges on load.
- **Triangle shape inconsistency:** The triangle shape uses CSS `border` tricks rather than SVG, making it visually inconsistent with all other SVG-based shapes. Should be refactored to SVG `<polygon>`.
- **Node handle discoverability:** Handles only appear on hover, which is confusing for users who don't know to hover a node before connecting. Consider always-visible subtle handles or a first-run hint.
- **DSL node IDs are UUIDs:** When a node is added via the canvas and the diagram is viewed in the Code panel, the node's ID is a raw UUID (e.g., `a30d7129-d59a-484b-a8b9-dea5a771107d`). This makes the DSL hard to read and edit by hand. IDs should be generated as human-friendly incremental names based on node type (e.g., the first API node becomes `API_1`, the second `API_2`). Affects `DiagramEditor.tsx` where nodes are created and `diagramParser.ts` where IDs are referenced.
- **Code panel live validation fires mid-type:** The DSL code panel validates on every keystroke. If you are mid-sentence (e.g., typing a node label) the validator throws errors before you finish, which is distracting and makes the panel feel broken. Validation should be debounced (e.g., 600ms after the last keystroke) and there should be an optional toggle to disable live validation entirely if preferred.
- **Code panel lacks copy/paste support:** The DSL code panel does not reliably support standard copy (`Ctrl+C`) and paste (`Ctrl+V`) operations. Selecting text and copying it, or pasting DSL from an external source, is either blocked or inconsistent. The editor (CodeMirror) needs its key bindings and clipboard permissions verified and explicitly enabled.

---

## Architecture Notes

Understanding these before building new features avoids duplicating logic or breaking existing systems.

- **Diagram state** lives in React state (`useNodesState` / `useEdgesState`) and is serialised to `localStorage` on save. There is no server-side persistence today.
- **Edge waypoints** are stored as `edge.data.waypoints: {x, y}[]` and rendered by `EditableEdge.tsx`. Any feature touching edges must preserve this field.
- **Undo/redo** is handled by `hooks/useHistory.ts`, which snapshots full node/edge arrays. Structural changes should call `takeSnapshot()` before mutating state.
- **DSL parser** at `lib/diagramParser.ts` converts text input to node/edge arrays. AI panel and code panel both use it.
- **AI generation** calls a language model endpoint via the AI panel, parses the result as DSL, then runs it through the parser.

---

## Completed

- [x] Transparent React Flow controls and pane background
- [x] Minimap show/hide toggle in toolbar
- [x] Editable edge waypoints (click to add, drag to move, × to delete individual points)
- [x] Edge delete button on hover
- [x] Expanded shape library (diamond, hexagon, cylinder, parallelogram, cloud, star, oval)
- [x] Connection handles on all four sides of nodes

---

## Planned Feature List

### Sprint 1 — Canvas Interaction Polish

#### 1.1 Shape Resize Handles
Allow nodes to be resized by dragging corner/edge handles. Especially useful for boxes, shapes, and group containers. React Flow supports `NodeResizer` — wire it in for shape-type nodes.

#### 1.2 Edge Type Selector (per connection)
Right-click context menu option to switch an individual edge between bezier, straight, step, and smoothstep routing styles without losing waypoints.

#### 1.3 Zoom-to-Selection
A toolbar button or keyboard shortcut (e.g. `Shift+Z`) that fits the viewport to only the currently selected nodes, rather than the whole diagram.

#### 1.4 Minimap Click-to-Navigate
Make the minimap interactive so clicking or dragging on it pans the main canvas to that position. React Flow's `MiniMap` component supports `onClick` and `onNodeClick` props — wire them in.

---

### Sprint 2 — Node Richness

#### 2.1 Group / Container Nodes
Add a "Group" node type that other nodes can be dragged inside. Groups act as visual containers with a label, collapsible behaviour, and automatic resizing to fit children. Builds on resize handles from Sprint 1.

#### 2.2 Custom Node Icons / Image Upload
Let users upload a PNG or SVG and use it as a node's icon. Stored as base64 in node data. Useful for mapping real-world services (AWS, GCP, databases, etc.) onto diagram nodes.

#### 2.3 Diagram Comments / Annotations
Sticky-note style comments that float above the canvas and are not connected to any node. Useful for leaving context, reminders, or section labels directly on the diagram.

#### 2.4 Dark/Light Theme Toggle
Add a proper light mode with adjusted color tokens. Currently the app is dark-only. Persist the preference in `localStorage`.

---

### Sprint 3 — Content & Export

#### 3.1 Custom Edge Labels with Rich Text
Allow edge labels to contain multi-line text, icons, or styled badges (e.g. HTTP method tags like `GET` / `POST`). Double-click an edge label to open a mini rich-text editor.

#### 3.2 Import from Mermaid / PlantUML
Parse Mermaid.js or PlantUML syntax and render it as an editable React Flow diagram. Complements the existing Mermaid export to create a full round-trip workflow.

#### 3.3 Path Animation Controls
Per-edge controls for animation speed, flow direction (forward/reverse), and an on/off toggle. Useful for illustrating data flow direction on a specific connection.

#### 3.4 Export to Confluence / Notion / Markdown
Generate an embeddable diagram for Confluence (XML), a Notion-compatible image block, or a Markdown file with a rendered PNG attached.

---

### Sprint 4 — App-Level Features

#### 4.1 Multi-Page / Tab Diagrams
Support multiple diagram pages within a single project file. Users can add named tabs (e.g. "Overview", "Data Layer", "Auth Flow") and switch between them without losing state. Largest state management change in this plan — diagram state becomes a map keyed by page ID.

#### 4.2 Connection Validation Rules
Allow users to define rules that prevent invalid connections (e.g. "a DB node can only connect to a Service node"). Show visual feedback when a connection attempt violates a rule.

#### 4.3 Node Statistics Panel
A sidebar that shows diagram stats: total node and edge counts, nodes by category, most-connected node, and orphaned nodes (nodes with no connections).

#### 4.4 Keyboard Shortcut Customization
Let users remap keyboard shortcuts from a settings panel. Store custom bindings in `localStorage`.

---

### Sprint 5 — AI Enhancements

> **Build order note:** Item 5.5 (sample diagrams) is a natural starting point since the resulting examples directly inform the template library in 5.4. Items 5.1 and 5.2 extend the existing AI panel and can be worked in parallel. Item 5.3 is the most complex — it requires an API server endpoint and external service integration — and is best tackled last.

#### 5.1 Diagram to Documentation
AI reads the current diagram's nodes and edges and generates a structured Markdown document explaining the architecture. Output includes a system overview, a description of each node and its role, connection annotations, and a glossary of terms. The generated file can be copied to clipboard or downloaded directly.

#### 5.2 Documentation to Diagram
User pastes existing written documentation (e.g. a README, architecture doc, or design spec) into a panel. AI extracts the entities, systems, and relationships described in the text and generates a diagram from them. Works as an extension of the existing AI generation flow — new input mode, same DSL output pipeline.

#### 5.3 Git Repository to Diagram
Connect to a GitHub repository (via the GitHub API using a personal access token) and automatically generate diagrams from the codebase. The AI analyzes the file structure, import dependencies, API routes, and data models, then outputs one or more diagrams: a component/module dependency graph, a data flow diagram, or a service map. The user selects which diagram type to generate. Output is editable on the canvas like any other diagram.

#### 5.4 Documentation Templates & AI-Guided Completion
A built-in library of pre-built diagram and documentation template pairs covering common architectures (e.g. "REST API", "Microservices", "Data Pipeline", "Auth Flow", "Cloud Infrastructure"). Each template ships in two forms: a fully worked example and a blank version with labelled placeholder sections. The AI can either auto-fill a blank template based on the user's current diagram, or guide the user through it interactively — asking one question at a time and assembling the document as answers come in.

#### 5.5 Expand and Improve Sample Diagrams
Refresh the existing built-in sample diagrams to be more realistic and useful as references. Add new samples covering architectures not currently represented: microservices, event-driven systems, CI/CD pipelines, data lake ingestion, and mobile app backend. These samples also serve as the initial content for the template library in 5.4.

---

### Sprint 6 — Persistence (Lower Priority)

> These features are lower priority for a single-user local app since `localStorage` and git together cover most needs. They become more valuable if the app is ever used across multiple devices or the browser's storage is at risk of being cleared. Build in order: 6.1 first (cloud storage foundation), then 6.2 (version snapshots), then 6.3 (visual diff — depends on 6.2).

#### 6.1 Auto-Save to Cloud
Replace the `localStorage`-only persistence with cloud save via a backend API. Diagrams are saved automatically to a database so they survive browser clears and are accessible from any device. Requires a user authentication layer.

#### 6.2 Version History & Branching
Save named snapshots of the diagram (e.g. "v1.0 — before auth layer") and allow restoring any previous version with one click. This operates at the diagram level — named checkpoints meaningful to the diagram's content — not at the git/code level. **Required by 6.3.**

#### 6.3 Diagram Diff / Change Tracking
Show a visual diff between any two saved versions from Version History (6.2): added nodes highlighted green, removed nodes red, changed edges marked. Gives a quick way to review what changed architecturally between two points in time. **Requires 6.2.**

---

## Backlog / Not Currently Planned

| Feature | Notes |
|---------|-------|
| Real-Time Collaboration | WebSocket-based live cursors and shared editing. Requires CRDT or operational transform conflict resolution plus a persistent backend. Complex enough to be its own multi-sprint project — revisit only if the app ever becomes multi-user. |
