#!/usr/bin/env node
'use strict';
// PLO4 Hand Equity Ranker
// Groups all 270,725 hands into canonical suit-equivalent classes (~16K groups)
// Runs TRIALS Monte Carlo simulations per class vs one random opponent + random board
// PLO rules: exactly 2 hole cards + 3 board cards

const TRIALS = 50000;
const t0 = Date.now();
const log = s => process.stderr.write(s + '\n');

/* ── Shared typed arrays — avoid GC pressure in hot path ───── */
const _cnt = new Int8Array(13);
const _rr5 = new Int8Array(5);

/* ── 5-card hand evaluator ─────────────────────────────────── */
// Card encoding: rank*4+suit  (rank 0='2'..12='A', suit 0=s 1=h 2=d 3=c)
// Returns integer score; higher = better
function eval5(a, b, c, d, e) {
  const r0=a>>2, r1=b>>2, r2=c>>2, r3=d>>2, r4=e>>2;

  _cnt[r0]++; _cnt[r1]++; _cnt[r2]++; _cnt[r3]++; _cnt[r4]++;

  let quad=-1, trip=-1, pa=-1, pb=-1, k0=-1, k1=-1, k2=-1;
  for (let x = 12; x >= 0; x--) {
    const n = _cnt[x];
    if      (n===4) quad = x;
    else if (n===3) trip = x;
    else if (n===2) { if (pa < 0) pa = x; else pb = x; }
    else if (n===1) { if (k0 < 0) k0 = x; else if (k1 < 0) k1 = x; else k2 = x; }
  }
  _cnt[r0]=0; _cnt[r1]=0; _cnt[r2]=0; _cnt[r3]=0; _cnt[r4]=0; // reset

  _rr5[0]=r0; _rr5[1]=r1; _rr5[2]=r2; _rr5[3]=r3; _rr5[4]=r4;
  _rr5.sort(); // ascending; [4]=highest rank
  const H=_rr5[4], h1=_rr5[3], h2=_rr5[2], h3=_rr5[1], h4=_rr5[0];

  const flush = (a&3)===(b&3) && (b&3)===(c&3) && (c&3)===(d&3) && (d&3)===(e&3);

  // Straight only possible with 5 distinct ranks
  let st = false, sh = 0;
  if (quad<0 && trip<0 && pa<0) {
    if (H - h4 === 4)                                          { st=true; sh=H; }
    else if (H===12 && h1===3 && h2===2 && h3===1 && h4===0)  { st=true; sh=3; } // wheel
  }

  if (flush && st)    return 800000000 + sh;
  if (quad >= 0)      return 700000000 + quad*14 + (k0>=0?k0:0);
  if (trip>=0&&pa>=0) return 600000000 + trip*14 + pa;
  if (flush)          return 500000000 + H*28561 + h1*2197 + h2*169 + h3*13 + h4;
  if (st)             return 400000000 + sh;
  if (trip >= 0)      return 300000000 + trip*169 + (k0>=0?k0*13:0) + (k1>=0?k1:0);
  if (pa>=0 && pb>=0) return 200000000 + pa*196 + pb*14 + (k0>=0?k0:0);
  if (pa >= 0)        return 100000000 + pa*2744 + (k0>=0?k0*196:0) + (k1>=0?k1*14:0) + (k2>=0?k2:0);
  return H*28561 + h1*2197 + h2*169 + h3*13 + h4;
}

/* ── PLO: best 5-card hand using exactly 2 hole + 3 board ──── */
const _hp = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];         // 6 hole pairs
const _bt = [[0,1,2],[0,1,3],[0,1,4],[0,2,3],[0,2,4],[0,3,4],
             [1,2,3],[1,2,4],[1,3,4],[2,3,4]];              // 10 board triplets

function evalPLO(h, b) {
  let best = -1;
  for (let i = 0; i < 6; i++) {
    const h0=_hp[i][0], h1=_hp[i][1];
    for (let j = 0; j < 10; j++) {
      const v = eval5(h[h0], h[h1], b[_bt[j][0]], b[_bt[j][1]], b[_bt[j][2]]);
      if (v > best) best = v;
    }
  }
  return best;
}

/* ── Canonical suit normalization ──────────────────────────── */
// Two hands are suit-equivalent iff one is a suit-permutation of the other.
// Try all 4!=24 suit permutations, encode each, return minimum — guarantees
// all isomorphic hands (including same-rank cards) map to the same key.
const _PERMS4 = [];
(function gen(a, c) {
  if (!a.length) { _PERMS4.push(c); return; }
  for (let i = 0; i < a.length; i++)
    gen([...a.slice(0,i), ...a.slice(i+1)], [...c, a[i]]);
})([0,1,2,3],[]);

function canonKey(c0, c1, c2, c3) {
  const cards = [c0, c1, c2, c3];
  let best = Infinity;
  for (const perm of _PERMS4) {
    // remap suits according to this permutation
    const remapped = [
      ((cards[0]>>2)<<2) | perm[cards[0]&3],
      ((cards[1]>>2)<<2) | perm[cards[1]&3],
      ((cards[2]>>2)<<2) | perm[cards[2]&3],
      ((cards[3]>>2)<<2) | perm[cards[3]&3],
    ];
    remapped.sort((a,b) => (b>>2)-(a>>2) || (a&3)-(b&3));
    const sm = [-1,-1,-1,-1]; let ns = 0, key = 0;
    for (let i = 0; i < 4; i++) {
      const r = remapped[i]>>2, s = remapped[i]&3;
      if (sm[s] < 0) sm[s] = ns++;
      key = key * 52 + (r*4 + sm[s]);
    }
    if (key < best) best = key;
  }
  return best;
}

/* ── Enumerate all C(52,4) = 270,725 hands ─────────────────── */
log('Enumerating C(52,4) = 270,725 hands...');
const flat = new Uint8Array(270725 * 4);
let nH = 0;
for (let a=0; a<49; a++)
for (let b=a+1; b<50; b++)
for (let c=b+1; c<51; c++)
for (let d=c+1; d<52; d++) {
  flat[nH*4]=a; flat[nH*4+1]=b; flat[nH*4+2]=c; flat[nH*4+3]=d; nH++;
}
log(`${nH} hands enumerated`);

/* ── Group by canonical suit form ──────────────────────────── */
log('Grouping by canonical suit equivalence...');
const groups = new Map();
for (let i = 0; i < nH; i++) {
  const k = canonKey(flat[i*4], flat[i*4+1], flat[i*4+2], flat[i*4+3]);
  if (!groups.has(k)) groups.set(k, [i]);
  else groups.get(k).push(i);
}
log(`${groups.size} canonical groups (${(270725/groups.size).toFixed(1)}x reduction)`);

/* ── Monte Carlo equity per group ─────────────────────────── */
log(`Running ${TRIALS} trials × ${groups.size} groups = ${(TRIALS*groups.size/1e6).toFixed(2)}M total trials...`);
const equity = new Float32Array(nH);

// Reused buffers
const perm  = new Uint8Array(48);
const rem   = new Uint8Array(48);
const hhand = new Uint8Array(4);
const board = new Uint8Array(5);
const vill  = new Uint8Array(4);

let done = 0;
for (const [, idxs] of groups) {
  const rep = idxs[0];
  const h0=flat[rep*4], h1=flat[rep*4+1], h2=flat[rep*4+2], h3=flat[rep*4+3];
  hhand[0]=h0; hhand[1]=h1; hhand[2]=h2; hhand[3]=h3;

  // Build remaining 48-card deck
  let rn = 0;
  for (let x=0; x<52; x++)
    if (x!==h0 && x!==h1 && x!==h2 && x!==h3) rem[rn++] = x;
  for (let x=0; x<48; x++) perm[x] = x;

  let wins=0, ties=0;
  for (let t=0; t<TRIALS; t++) {
    // Partial Fisher-Yates: pick 9 random cards (5 board + 4 villain)
    for (let x=0; x<9; x++) {
      const j = x + ((Math.random() * (48-x)) | 0);
      const tmp=perm[x]; perm[x]=perm[j]; perm[j]=tmp;
    }
    board[0]=rem[perm[0]]; board[1]=rem[perm[1]]; board[2]=rem[perm[2]];
    board[3]=rem[perm[3]]; board[4]=rem[perm[4]];
    vill[0] =rem[perm[5]]; vill[1] =rem[perm[6]]; vill[2] =rem[perm[7]]; vill[3]=rem[perm[8]];

    const hs = evalPLO(hhand, board);
    const vs = evalPLO(vill,  board);
    if      (hs > vs) wins++;
    else if (hs === vs) ties++;
  }

  const eq = (wins + ties * 0.5) / TRIALS;
  for (const idx of idxs) equity[idx] = eq;

  done++;
  if (done % 2000 === 0 || done === groups.size) {
    const el = (Date.now()-t0) / 1000;
    const eta = el / done * (groups.size - done);
    log(`  ${done}/${groups.size} (${(done/groups.size*100).toFixed(1)}%) | ${el.toFixed(1)}s elapsed | ETA ${eta.toFixed(0)}s`);
  }
}

/* ── Sort by equity descending and emit CSV ────────────────── */
log('Sorting...');
const order = Array.from({length: nH}, (_,i) => i).sort((a,b) => equity[b]-equity[a]);

const RANKS = '23456789TJQKA';
const SUITS = 'shdc';
const cardStr = c => RANKS[c>>2] + SUITS[c&3];

log('Writing CSV...');
const lines = ['rank,hand,equity_pct'];
for (let r = 0; r < nH; r++) {
  const i = order[r];
  lines.push(`${r+1},${cardStr(flat[i*4])}${cardStr(flat[i*4+1])}${cardStr(flat[i*4+2])}${cardStr(flat[i*4+3])},${(equity[i]*100).toFixed(2)}`);
}
process.stdout.write(lines.join('\n') + '\n');

log(`Done in ${((Date.now()-t0)/1000).toFixed(1)}s`);
