# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file, standalone HTML5 application for Pot Limit Omaha (PLO) poker hand range analysis. The entire application — HTML, CSS, and JavaScript — lives in one file:

**`plo_range_analyzer_v2_top_range_fixed.html`** (~3,800 lines)

There is no build system, no package manager, and no external dependencies. To run, simply open the HTML file in a browser.

## Architecture

The application is organized into functional subsystems within a single `<script>` block:

### Range Input Formats
Two syntaxes are supported:
1. **Explicit combos:** `AsKsQhJh@100, QhQs3s2s@79` — direct hand specification with optional weights (0–100)
2. **ORS (Omaha Range Syntax):** Pattern language with set operations
   - Card groups: `B`=AKQJ, `M`=T987, `Z`=65432, `W`=A2345, `N`=KQJT9, `L`=A-8
   - Pattern wildcards: `AA**` (pair of aces), `*h*h**` (flush draw)
   - Percentile filters: `10%`, `15%-30%`
   - Set operations: `,` (union), `&` (intersect), `!` (difference)

### Core Pipeline (Data Flow)
```
Range text → parseRangeText() / orsExpand()
           → List of hand combos with weights
           → analyzeHand() per hand (extracts features: suitedness, connectivity, pairing, rank strength)
           → analyze() aggregates by feature categories
           → renderTable() displays summary/detail
           → (optional) runExplorer() Monte Carlo flop simulation
           → renderFlopTypeTable() / drawGroupedBarChartInto()
```

### Key Subsystems

**Parser (`orsTokenize`, `parseExpr`, `parseDiff`, `parseIsect`, `parsePrimary`, `orsExpand`):** Recursive descent parser for ORS. `orsExpand()` is the public entry point that returns an array of 4-card combos.

**Hand Analysis (`handFeatures`, `handScore`, `suitCountsInHand`, `rankCountsInHand`):** Pure functions that classify a hand into features used for bucketing — suitedness (monotone/2-tone/rainbow), connectivity, pairing, and high-card strength percentile.

**Aggregation (`analyze`, `getAnchorFeatures`, `featDist`):** Groups expanded hand lists by similarity to "anchor" feature buckets; `analyze()` is the main entry point called on button click.

**Flop Simulation (`runExplorer`, `flopTypesCatalog`, `flopTypeFlags`, `mulberry32`):** Seeded PRNG (Mulberry32) Monte Carlo simulation. `flopTypesCatalog()` enumerates board classifications (monotone, paired, connected, etc.). `runExplorer()` samples flops for each range slot and tallies outcomes.

**Persistence (IndexedDB):** Database name `plo_range_analyzer_v2`, object store `ranges`. Helper wrappers: `idbAll`, `idbGet`, `idbPut`, `idbDelete`, `idbBulkPut`. Theme preference stored separately in `localStorage` as `plo_theme`.

**UI/Rendering:** Canvas 2D API for bar charts (`drawGroupedBarChartInto`), DOM manipulation for tables and hand chip display (`renderHandChips`, `renderTable`, `renderFlopTypeTable`). Three range input slots (A, B, C) allow side-by-side comparison.

### Combinatorics
`nCk(n,k)` handles combination counting. Hand combo enumeration generates all valid 4-card combinations from a 52-card deck, filtering by ORS pattern matches or explicit specifications.
