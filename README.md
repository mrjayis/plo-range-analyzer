# PLO Range Analyzer

A single-file, standalone browser app for Pot Limit Omaha hand range analysis, flop equity exploration, and frequency quizzing. Supports PLO4, PLO5, and PLO6.

**[Live app →](https://mrjayis.github.io/plo-range-analyzer/)**

No install. No server. Download and open in any browser.

---

## Features

### Range Analysis
- Parse and analyze PLO4/5/6 hand ranges using explicit combos or ORS (Omaha Range Syntax)
- Side-by-side comparison of up to 3 ranges (A / B / C)
- Breakdowns by suitedness, connectivity, pairing, and high-card strength
- Range size displayed as a percentage of all possible hands (exact for PLO4, approximate for PLO5/6)
- Plain-English range description (combo count, suitedness %, pairing %, connectivity %)
- Save and load ranges via a built-in library (IndexedDB)
- Natural language → ORS translator powered by Claude AI (API key required)

### Flop Explorer
- Monte Carlo simulation across all flop types for up to 3 ranges simultaneously
- Tracks made hands (two pair, set, flush, straight, full house, etc.) and draws (flush draw, OESD, gutshot, etc.) per range per flop type
- Flop type catalog: Any, Monotone, Two-tone, Rainbow, Paired, Unpaired, Trips, Low, 2-broadway, 3-broadway, High-connected, Low-connected
- Flop types with the largest frequency gap between ranges are highlighted automatically
- Specific flop syntax: enter explicit boards (`As Kd 7c`) or ORS flop patterns to constrain sampling
- Parallel web worker execution for fast simulation

### Multiway Equity Buckets
- True N-way equity computation (not pairwise) — all active ranges compete simultaneously
- Buckets: Nut (≥75%), Good (40–75%), Marginal (33–40%), Trash (<33%)
- Results accumulate across repeated runs for higher sample counts
- Filterable by flop type or specific boards
- Parallelised across web workers

### Quiz Mode
- Generates questions from your own explorer results
- Questions weighted by flop frequency — common boards appear more often
- Filters out invalid question combinations (e.g. flush draws on rainbow flops)
- Configurable tolerance (±3% / ±5% / ±10%)
- Score tracking per session

### CSV Export
- Export all explorer results (including flop type intersections like "Two-tone ∩ 2-broadway") as a CSV

---

## ORS — Omaha Range Syntax

Ranges can be entered as explicit combos or as ORS expressions:

| Syntax | Meaning |
|--------|---------|
| `AsKsQhJh@100` | Explicit combo with weight |
| `AA**` | Any hand with a pair of aces |
| `*h*h**` | Any two-suited hand |
| `AA**$ds` | Double-suited aces |
| `B` | Broadway card (A/K/Q/J) |
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
- **Hand analysis:** Pure functions classify suitedness, connectivity, pairing, and rank strength
- **Simulation:** Seeded Mulberry32 PRNG, parallelised across Web Workers
- **Persistence:** IndexedDB for saved ranges; `localStorage` for theme and UI state
- **Charts:** Canvas 2D API

---

## Usage

1. Download `plo_range_analyzer_v22.html` (or use the [live app](https://mrjayis.github.io/plo-range-analyzer/))
2. Open in Chrome, Firefox, or Safari
3. Paste a range into slot A (explicit combos or ORS syntax)
4. Click **Analyze Range** for hand breakdowns
5. Add ranges B and/or C, then click **Run Explorer** for flop simulation
6. Click **Run Buckets** for multiway equity distribution
7. Click **Quiz Me** to test yourself on the results
