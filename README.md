# PLO Range Analyzer

A single-file, standalone browser app for Pot Limit Omaha hand range analysis, flop equity exploration, and frequency quizzing.

No install. No server. Open `plo_range_analyzer_v15.html` in any browser.

---

## Features

### Range Analysis
- Parse and analyze PLO hand ranges using explicit combos or ORS (Omaha Range Syntax)
- Side-by-side comparison of up to 3 ranges (A / B / C)
- Breakdowns by suitedness, connectivity, pairing, and high-card strength
- Save and load ranges via a built-in library (IndexedDB)

### Flop Explorer
- Monte Carlo simulation across all flop types
- Tracks made hands (two pair, set, flush, straight, full house, etc.) and draws (flush draw, OESD, gutshot) for each range on each flop type
- Supports flop type filters (monotone, two-tone, rainbow, paired, trips, low, broadway, connected)
- Specific flop syntax: enter explicit boards (`As Kd 7c`) or ORS flop patterns (`RRO`, `A**!AA*`, `[T+][T+][T+]`, `234+`) to constrain sampling
- Parallel web worker execution for fast simulation

### Quiz Mode
- Generates questions from your own explorer results
- Questions weighted by flop frequency — common boards appear more often
- Filters out meaningless question combinations (e.g. flush draws on rainbow flops, straight draws on suit-only flops)
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
| `*h*h**` | Any hand with a flush draw |
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
- **Persistence:** IndexedDB for saved ranges; `localStorage` for theme preference
- **Charts:** Canvas 2D API

---

## Usage

1. Download `plo_range_analyzer_v15.html`
2. Open it in Chrome, Firefox, or Safari
3. Paste a range into slot A (explicit combos or ORS syntax)
4. Click **Analyze Range** for hand breakdowns
5. Click **Run Explorer** for flop equity simulation
6. Click **Quiz Me** to test yourself on the results
