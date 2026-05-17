# DrawFlow — Planning & Roadmap

---

## Known Issues / Tech Debt

These are tracked issues that need to be addressed before or alongside feature work to avoid compounding problems.

- **Edge migration shim:** Saved diagrams that used the old `smoothstep` edge type won't render correctly after the migration to `editable` edges. Need a backward-compat shim in `handleLoad` that upgrades old edges on load.
- **Triangle shape inconsistency:** The triangle shape uses CSS `border` tricks rather than SVG, making it visually inconsistent with all other SVG-based shapes. Should be refactored to SVG `<polygon>`.
- **Node handle discoverability:** Handles only appear on hover, which is confusing for new users who don't know to hover a node before connecting. Consider always-visible subtle handles or a first-run hint.

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

## Sprint Plan

### Sprint 1 — Canvas Interaction Polish
**Items: 1, 3, 11, 13**
*(Pulling 11 and 13 forward from their original positions — both are 1–2 line changes and cost nothing to include now)*

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 1 | Shape Resize Handles | Medium | React Flow `NodeResizer` component; scoped to CustomNode.tsx |
| 3 | Edge Type Selector (per connection) | Small | Add to right-click edge context menu; no new state |
| 11 | Zoom-to-Selection | Tiny | One toolbar button + `fitView({ nodes: selected })` call |
| 13 | Minimap Click-to-Navigate | Tiny | MiniMap already supports `onClick` / `onNodeClick` props — just wire it |

**Why these together:** All pure canvas-interaction changes. No new state management, no new components. Items 11 and 13 are free additions — skipping them here means doing another sprint just for two-line changes.

---

### Sprint 2 — Node Richness
**Items: 2, 4, 5, 9**

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 2 | Group / Container Nodes | Large | React Flow SubFlow API; works better after resize handles exist (Sprint 1) |
| 4 | Custom Node Icons / Image Upload | Medium | File input → base64 in node data; isolated to CustomNode.tsx |
| 5 | Diagram Comments / Annotations | Small | New floating sticky-note node type; no edge logic |
| 9 | Dark/Light Theme Toggle | Small | CSS variable token swap; fully isolated from all other features |

**Why these together:** Items 4, 5, and 9 don't touch each other at all and can be built in parallel. Item 2 is the anchor — it's the largest piece and benefits from resize handles from Sprint 1.

---

### Sprint 3 — Content & Export
**Items: 6, 8, 12, 15**

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 6 | Custom Edge Labels with Rich Text | Medium | Extends the existing edge label editor; scoped to EditableEdge.tsx |
| 8 | Import from Mermaid / PlantUML | Medium | Parser work in `lib/`; complements existing Mermaid export |
| 12 | Path Animation Controls | Small | Extends edge data + adds UI to right-click menu |
| 15 | Export to Confluence / Notion / Markdown | Medium | Pure export logic; no canvas changes |

**Why these together:** Items 6 and 12 both touch edge data/rendering. Items 8 and 15 are both import/export — they live in `lib/` and don't touch canvas components.

---

### Sprint 4 — Application-Level Features
**Items: 7, 10, 14, 16**

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 7 | Multi-Page / Tab Diagrams | Large | Biggest state management change; wrap diagram state in a pages map |
| 10 | Connection Validation Rules | Medium | Logic layer; doesn't change rendering, only connection behaviour |
| 14 | Node Statistics Panel | Small | New sidebar panel component; reads from existing node/edge state |
| 16 | Keyboard Shortcut Customization | Medium | Settings panel + localStorage-backed binding map |

**Why these together:** All "application shell" features rather than canvas features. Item 7 is the heaviest lift of the sprint; 14 and 16 can be done in parallel alongside it.

---

### Sprint 5 — Persistence Layer *(only if deploying publicly or going multi-user)*
**Items: 17, 18, 19**

> **Note:** These are only worth building if the app is hosted for multiple users or accessed across devices. If you're the sole user working from a single machine with git, git already gives you most of this at the code level for free. The value of these features is specifically for non-technical users or shared/cloud deployments.

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 17 | Version History & Branching | Medium | In-app named snapshots stored in localStorage (or cloud); different from git — these are user-friendly diagram checkpoints, not code commits |
| 18 | Auto-Save to Cloud | Large | Requires a backend (API + database); replaces localStorage-only persistence. Precondition for 17 and 19 at scale |
| 19 | Diagram Diff / Change Tracking | Large | Visual canvas diff (nodes green/red) between two saved versions; depends on 17 |

**Build order within Sprint 5:** 18 first (cloud save), then 17 (version history), then 19 (diff). Each depends on the previous.

---

### Backlog / Future (not planned)

| Feature | Reason deferred |
|---------|----------------|
| Real-Time Collaboration | Requires WebSocket infrastructure, CRDT or OT conflict resolution, and user auth. Complex enough to be its own multi-sprint project. Track it but don't plan it until the persistence layer (Sprint 5) is complete. |

---

## Sprint Summary

| Sprint | Items | Theme |
|--------|-------|-------|
| 1 | 1, 3, 11, 13 | Canvas interaction polish |
| 2 | 2, 4, 5, 9 | Node richness |
| 3 | 6, 8, 12, 15 | Content & export |
| 4 | 7, 10, 14, 16 | Application-level features |
| 5 | 17, 18, 19 | Persistence layer (conditional) |
| Backlog | Real-Time Collaboration | Future |
