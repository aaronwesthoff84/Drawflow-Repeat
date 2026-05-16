# DrawFlow → Repeat

A powerful, browser-based diagramming tool built with React and React Flow. Design architecture diagrams, system flows, data pipelines, and more — all without leaving your browser.

## Features

### Canvas & Navigation
- **Infinite canvas** with smooth pan and zoom
- **Background variants** — dots, lines, crosshatch, or none
- **Minimap** toggle for bird's-eye navigation
- **Snap-to-grid** for precise alignment
- **Presentation mode** — fullscreen, clean view for demos
- **Find/search** nodes by label (Ctrl+F)

### Nodes
- **Architecture nodes** — Web, Mobile, User, API, Service, Worker, DB, Cache, Queue, Stream, External, Metrics
- **Expanded shape library** — Box, Circle, Oval, Triangle, Diamond, Hexagon, Cylinder, Parallelogram, Cloud, Star
- **Text labels** — standalone floating text
- **Double-click** any node to rename it
- **Per-node color** — 8 accent color presets
- **Node locking** — prevent accidental moves
- **Node notes** — attach markdown notes to any node
- **Drag from palette** or **double-click canvas** to add nodes instantly

### Connections
- **Smart bezier routing** by default
- **Editable edges** — click any connection line to add bend points (waypoints)
- **Drag waypoints** to reroute paths exactly where you want
- **Delete individual waypoints** — hover a waypoint to reveal its × button
- **Delete entire edge** — hover/select edge to show the "del edge" button, or right-click for context menu
- **Edge styling** — solid, dashed, dotted; thin, normal, thick; 6 color options
- **Edge labels** — double-click or right-click to add text labels
- **Arrow markers** — directional arrows on all connections

### Editing
- **Undo/Redo** (Ctrl+Z / Ctrl+Y) with full history
- **Copy/Paste** nodes and edges (Ctrl+C / Ctrl+V)
- **Select all** (Ctrl+A)
- **Delete** selected nodes/edges (Delete or Backspace)
- **Keyboard arrow navigation** between nodes
- **Node context menu** — right-click for duplicate, add note, lock, delete
- **Edge context menu** — right-click for style, color, label, delete

### Layout & Export
- **Auto layout** — arranges nodes by category in columns
- **Export PNG** — high-quality 2x pixel density image
- **Export SVG** — vector format for scaling
- **Export Mermaid** — generate Mermaid.js diagram code
- **Import JSON** — load diagrams from JSON
- **Save/Load** — persists diagrams to browser localStorage
- **Copy JSON** — share diagram data via clipboard

### Panels & AI
- **Diagram-as-Code panel** — edit the diagram via a DSL text editor
- **AI panel** — describe a diagram and have it generated automatically
- **Notes panel** — per-diagram rich notes sidebar
- **Command palette** (Ctrl+K) — keyboard-first access to all actions
- **Template gallery** — starter templates for common architectures

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
git clone https://github.com/your-username/drawflow
cd drawflow
pnpm install
```

### Development

```bash
PORT=24797 BASE_PATH=/ pnpm --filter @workspace/drawflow run dev
```

Open [http://localhost:24797](http://localhost:24797) in your browser.

### Build for Production

```bash
pnpm --filter @workspace/drawflow run build
```

## Usage Tips

| Action | How |
|---|---|
| Add a node | Drag from palette, or double-click canvas |
| Rename a node | Double-click the node |
| Connect nodes | Hover a node → drag from a handle (edge of node) |
| Add a bend to a connection | Click anywhere on the connection line |
| Move a bend point | Drag the blue dot |
| Delete a bend point | Hover the blue dot → click the red × |
| Delete a connection | Hover the line → click "del edge", or right-click |
| Change edge color/style | Right-click the connection line |
| Save | Ctrl+S |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y or Ctrl+Shift+Z |
| Command palette | Ctrl+K |
| Find nodes | Ctrl+F |

## Tech Stack

- **React 18** — UI framework
- **@xyflow/react (React Flow v12)** — canvas and graph engine
- **Vite** — build tool
- **TailwindCSS v4** — styling
- **Lucide React** — icons
- **html-to-image** — PNG/SVG export
- **CodeMirror** — DSL code editor
- **Radix UI** — accessible UI primitives

## Project Structure

```
artifacts/drawflow/
├── src/
│   ├── components/
│   │   ├── DiagramEditor.tsx   # Main editor with state management
│   │   ├── CustomNode.tsx      # Node rendering (all shapes)
│   │   ├── EditableEdge.tsx    # Edge with waypoints + delete
│   │   ├── TopBar.tsx          # Toolbar and controls
│   │   ├── Palette.tsx         # Drag-and-drop node palette
│   │   ├── AIPanel.tsx         # AI diagram generation
│   │   ├── CodePanel.tsx       # DSL code editor
│   │   ├── NotesPanel.tsx      # Diagram notes sidebar
│   │   ├── CommandPalette.tsx  # Ctrl+K command palette
│   │   └── TemplateModal.tsx   # Template gallery
│   ├── hooks/
│   │   └── useHistory.ts       # Undo/redo history
│   ├── lib/
│   │   ├── diagramParser.ts    # DSL parser
│   │   └── mermaidExporter.ts  # Mermaid.js export
│   └── types.ts                # TypeScript types
```

## License

MIT
