# PLO Range Analyzer

A single-file, standalone browser app for Pot Limit Omaha hand range analysis, flop equity exploration, and frequency quizzing. Supports PLO4, PLO5, and PLO6.

**[Live app →](https://mrjayis.github.io/plo-range-analyzer/)**

No install. No server. Download and open in any browser.

---

## Features

### Range Analysis
- Parse and analyze PLO4/5/6 hand ranges using explicit combos or ORS (Omaha Range Syntax)
- Side-by-side comparison of up to **6 ranges (A–F)** simultaneously
- Breakdowns by suitedness, connectivity, pairing, and high-card strength
- Range size displayed as a percentage of all possible hands (exact for PLO4, approximate for PLO5/6)
- Plain-English range description (combo count, suitedness %, pairing %, connectivity %)
- Save and load ranges via a built-in library (IndexedDB), with a preset library of common ranges
- **Natural language → ORS translator** — describe a range in plain English and get back an ORS expression. For example: *"aces double suited"*, *"rundown hands with a flush draw"*, *"top 20% hands that aren't double-paired"*. Powered by Claude AI (your own Anthropic API key required). Adapts to your terminology over time via few-shot learning — each time you accept a translation it's saved as an example for future requests

### Flop Explorer
- Monte Carlo simulation across all flop types for up to 6 ranges simultaneously
- Tracks made hands (two pair, set, flush, straight, full house, etc.) and draws (flush draw, OESD, gutshot, wraps, etc.) per range per flop type
- Flop type catalog: Any, Monotone, Two-tone, Rainbow, Paired, Unpaired, Trips, Low, 2-broadway, 3-broadway, High-connected, Low-connected
- Multi-select flop types to intersect (e.g. Paired ∩ Monotone)
- Flop types with the largest frequency gap between ranges are highlighted automatically
- Specific flop syntax: enter explicit boards (`As Kd 7c`) or ORS flop patterns to constrain sampling
- Parallel web worker execution for fast simulation
- CSV export of all results including flop type intersections

### Equity Buckets
- True N-way equity computation (not pairwise) — all active ranges compete simultaneously
- **Two views:**
  - **Runout equity** — Monte Carlo runouts to showdown; buckets: Nut (≥75%), Good (40–75%), Marginal (33–40%), Trash (<33%)
  - **Flop made hands** — evaluates hand strength on the flop only (no runout); stacked bar showing Air, Pair, Draw, Two pair, Set/Trips, Straight, Flush, Full house/Quads
- **Winning hands at showdown chart** — stacked bar per range showing which PLO hand category wins the pot most often (High card / One pair / Two pair / Trips / Set / Straight / Flush / Full house / Quads / Str. flush); Set and Trips tracked separately
- **Equity distribution chart** — smoothed curve per range showing the full equity distribution across samples, with hover tooltip showing hand type labels
- Results accumulate across repeated runs for higher sample counts
- Filterable by any selected flop type or specific boards
- Full-width layout with interactive hover tooltips on all charts
- Parallel web worker execution

### Quiz Mode
- Generates questions from your own explorer results
- Questions weighted by flop frequency — common boards appear more often
- Filters out invalid question combinations (e.g. flush draws on rainbow flops)
- Configurable tolerance (±3% / ±5% / ±10%)
- Score tracking per session

---

## ORS — Omaha Range Syntax

Ranges can be entered as explicit combos or as ORS expressions:

| Syntax | Meaning |
|--------|---------|
| `AsKsQhJh@100` | Explicit combo with weight |
| `AA**` | Any hand with a pair of aces |
| `*h*h**` | Any two-suited hand |
| `AA**$ds` | Double-suited aces |
| `B` | Broadway card (A/K/Q/J/T) |
| `M` | Middle card (T/9/8/7) |
| `N` | Near-broadway (K/Q/J/T/9) |
| `15%` | Top 15% of hands by equity |
| `15%:*h*h**` | Top 15% hands that are two-suited |
| `AA**!AAKK` | Aces without AAKK |

**Flop patterns** (in the Specific Flops field):

| Pattern | Meaning |
|---------|---------|
| `As Kd 7c` | Exact board |
| `RRO` | Any paired board (R=R, O≠R) |
| `RON` | Any unpaired board |
| `xxx` | Monotone |
| `xyz` | Rainbow |
| `A**` | Any board with an ace |
| `A**!AA*` | Exactly one ace |
| `[T+][T+][T+]` | Three broadway cards |
| `789+` | 7-8-9 and all higher rundowns |

---

## Architecture

Everything lives in one HTML file — no build step, no dependencies, no server.

- **Parser:** Recursive descent ORS parser with set operations (union `,`, difference `!`, intersection `&`)
- **Hand analysis:** Pure functions classify suitedness, connectivity, pairing, and rank strength; connectivity labels include Rundown, Gapped, and Disconnected
- **Simulation:** Seeded Mulberry32 PRNG, parallelised across Web Workers
- **Equity lookup:** Embedded 16,432-group equity table (~175KB) powers the `%` percentile syntax for PLO4
- **Persistence:** IndexedDB for saved ranges; `localStorage` for theme, UI state, and NL translator examples
- **Charts:** Canvas 2D API (bar charts, stacked bars, equity distribution curves, hover overlays)

---

## Usage

1. Open the [live app](https://mrjayis.github.io/plo-range-analyzer/) or download `index.html`
2. Paste a range into slot A (explicit combos or ORS syntax)
3. Click **Analyze Range** for hand breakdowns
4. Add ranges B–F as needed, then click **Run Explorer** for flop simulation
5. Select a flop type from the table, then click **Compute Buckets** for multiway equity distribution
6. Click **Quiz Me** to test yourself on the explorer results
