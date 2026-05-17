# DrawFlow — Development Process

This document defines the build order, testing strategy, and sprint workflow used for developing DrawFlow.

---

## Build Order Philosophy

**Fix known issues first. Then sprint. Never the other way around.**

Known issues are tracked at the top of `PLANNING.md`. Before any sprint begins, that list is reviewed and cleared. The reason is simple: building new features on top of a broken foundation compounds the problem. A bug in how edges are stored today becomes a much harder bug once three sprints of new edge features are layered on top of it.

---

## Development Cycle

Each iteration follows this sequence:

```
Fix Known Issues → Clean Baseline → Sprint Build → Test → Fix Bugs → Confirm Clean → Repeat
```

### Step-by-step

**0. Fix Known Issues**
Review `PLANNING.md` → Known Issues / Tech Debt. Fix all listed items before starting the next sprint. Once resolved, move them to the Completed section. This gives you a clean, stable starting point.

**1. Sprint Build**
Build all items in the current sprint. Items within a sprint are designed to be parallel-safe — multiple items can be built in the same session without conflicting. See `PLANNING.md` for sprint contents and any dependency notes between items.

**2. Test**
Manually exercise every feature in the sprint, plus a quick regression check on features from previous sprints that overlap with the same components.

**3. Fix Bugs**
Address any issues found during testing. Minor issues (cosmetic, low-risk) can be tracked in `PLANNING.md` → Known Issues for the next cycle. Blocking issues (broken functionality, data loss, regressions) are fixed before moving on.

**4. Confirm Clean**
Re-test after fixes. Only move to the next sprint once the current sprint's features are stable.

**5. Repeat**
Start the next sprint at Step 0 (check the Known Issues list again before building).

---

## What This Is NOT

This is not a "build all sprints first, test at the end" process. That approach is tempting when features feel simple, but bugs discovered late are expensive — they're tangled with everything built after them. The sprint-by-sprint test cycle keeps fixes surgical.

---

## Where Issues Get Tracked

| Type | Where it goes |
|------|--------------|
| Found during build or testing | `PLANNING.md` → Known Issues / Tech Debt |
| Blocking the current sprint | Fix immediately before continuing |
| Minor / non-blocking | Log in Known Issues, fix before the next sprint starts |
| Out-of-scope idea during a sprint | Add to the relevant sprint in `PLANNING.md` for later |

---

## Diagram of the Process

You can paste the following into the DrawFlow **Diagram-as-Code** panel (the `</>` button in the toolbar) to render this process as a visual diagram on the canvas.

```
# DrawFlow Development Process Flow

fix_issues [service] "Fix Known Issues"
baseline [box] "Clean Baseline"
sprint [worker] "Sprint Build"
testing [metrics] "Test"
bugs [external] "Bugs Found?"
bugfix [service] "Fix Bugs"
clean [cache] "Sprint Clean"
continue [external] "More Sprints?"
final [metrics] "Final Review"
done [db] "Done"

fix_issues -> baseline "all issues resolved"
baseline -> sprint "begin sprint"
sprint -> testing "features built"
testing -> bugs
bugs -> bugfix "yes"
bugfix -> testing "re-test"
bugs -> clean "no"
clean -> continue
continue -> sprint "yes — next sprint"
continue -> final "no"
final -> done "all clear"
```

---

## Sprint Overview

| Sprint | Items | Theme | Status |
|--------|-------|-------|--------|
| Pre-Sprint | Known Issues 1–3 | Fix existing bugs | Not started |
| 1 | 1.1–1.4 | Canvas interaction polish | Not started |
| 2 | 2.1–2.4 | Node richness | Not started |
| 3 | 3.1–3.4 | Content & export | Not started |
| 4 | 4.1–4.4 | App-level features | Not started |
| 5 | 5.1–5.5 | AI enhancements | Not started |
| 6 | 6.1–6.3 | Persistence (lower priority) | Not started |

See `PLANNING.md` for the full description of each sprint item.
