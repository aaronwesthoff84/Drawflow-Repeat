# DrawFlow — Installation Guide

This guide covers everything from cloning the repository to running all services locally.

---

## Prerequisites

Make sure the following are installed before starting:

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Git | Any recent version | `git --version` |
| Node.js | 20.x or higher | `node --version` |
| pnpm | 10.x or higher | `pnpm --version` |

**Installing pnpm** (if you don't have it):
```bash
npm install -g pnpm
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/drawflow.git
cd drawflow
```

Replace `your-username/drawflow` with your actual GitHub repo path.

---

## 2. Install Dependencies

From the repo root, install all workspace dependencies in one command:

```bash
pnpm install
```

This installs dependencies for all packages in the monorepo (`drawflow`, `api-server`, `mockup-sandbox`, shared libraries) using the lockfile for reproducible installs.

---

## 3. Running the Services

The project is a pnpm monorepo with three services. You can run them individually or all together.

### DrawFlow (main diagramming app)

```bash
PORT=24797 BASE_PATH=/ pnpm --filter @workspace/drawflow run dev
```

Open **http://localhost:24797** in your browser.

### API Server (backend)

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

The API will be available at **http://localhost:8080**.

### Mockup Sandbox (component preview, optional)

```bash
PORT=8081 BASE_PATH=/__mockup pnpm --filter @workspace/mockup-sandbox run dev
```

---

## 4. Environment Variables / Startup Arguments

All services use environment variables set as command-line prefixes. There is no `.env` file required for local development.

### DrawFlow (`@workspace/drawflow`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | — | Port the Vite dev server listens on. Must be a free port. |
| `BASE_PATH` | Yes | — | URL base path prefix. Use `/` for root. Use `/__mockup` for the sandbox. |
| `NODE_ENV` | No | `development` | Set to `production` for a production build. Disables dev-only plugins. |

**Examples:**
```bash
# Standard local dev
PORT=24797 BASE_PATH=/ pnpm --filter @workspace/drawflow run dev

# Run on a different port
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/drawflow run dev

# Custom base path (e.g., behind a reverse proxy at /app)
PORT=24797 BASE_PATH=/app pnpm --filter @workspace/drawflow run dev
```

### API Server (`@workspace/api-server`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | Port the API server listens on. |
| `NODE_ENV` | No | `development` | Affects logging verbosity and error detail. |

---

## 5. Building for Production

### DrawFlow

```bash
pnpm --filter @workspace/drawflow run build
```

Output goes to `artifacts/drawflow/dist/public/`. Serve these static files with any web server (nginx, Caddy, etc.).

### API Server

```bash
pnpm --filter @workspace/api-server run build
```

Output goes to `artifacts/api-server/dist/`. Start with:
```bash
node artifacts/api-server/dist/index.mjs
```

### Build Everything

```bash
pnpm -r run build
```

---

## 6. Type Checking

```bash
# Check the DrawFlow app
pnpm --filter @workspace/drawflow run typecheck

# Check all packages
pnpm -r run typecheck
```

---

## 7. Project Structure (Quick Reference)

```
drawflow/                        ← repo root
├── artifacts/
│   ├── drawflow/                ← main diagramming app (React + Vite)
│   │   ├── src/
│   │   │   ├── components/      ← all UI components
│   │   │   ├── hooks/           ← useHistory, use-toast, etc.
│   │   │   ├── lib/             ← DSL parser, Mermaid exporter
│   │   │   ├── types.ts         ← shared TypeScript types
│   │   │   └── index.css        ← global styles + Tailwind
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── api-server/              ← backend API (Node.js/Hono)
│   └── mockup-sandbox/          ← isolated component preview server
├── lib/                         ← shared workspace libraries
├── README.md                    ← feature overview
├── INSTALL.md                   ← this file
├── PLANNING.md                  ← sprint plan and roadmap
├── package.json                 ← workspace root
└── pnpm-workspace.yaml          ← monorepo workspace config
```

---

## 8. Common Issues

**`vite: not found` on first run**
Run `pnpm install` from the repo root before starting any service.

**`Port XXXX is already in use`**
Another process is using that port. Either stop the other process, or change `PORT` to a free port (e.g., `PORT=5174`).

**`PORT environment variable is required`**
You forgot to prefix the command with `PORT=...`. The app will not start without it — this is intentional to avoid port conflicts.

**`BASE_PATH environment variable is required`**
Same as above — prefix the command with `BASE_PATH=/`.

**Diagrams disappeared after browser update**
Diagrams are stored in `localStorage`, which can be cleared by the browser. Export important diagrams as JSON (`Copy JSON` in the toolbar) and keep them in your repo for backup.
