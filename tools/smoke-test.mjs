#!/usr/bin/env node
/**
 * Echoes of Deep Space — deterministic regression harness.
 *
 *   node tools/smoke-test.mjs            # full run (static + 7 playthroughs)
 *   node tools/smoke-test.mjs --quick    # static checks only
 *   node tools/smoke-test.mjs --json     # machine readable summary
 *
 * Exit code 0 = all checks passed, 1 = at least one failure.
 * Zero dependencies: uses node:vm with tools/lib/dom-stub.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boot } from './lib/dom-stub.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const ARGS = new Set(process.argv.slice(2));
const QUICK = ARGS.has('--quick');
const JSON_OUT = ARGS.has('--json');

const failures = [];
const warnings = [];
const passes = [];
function ok(name, detail = '') { passes.push({ name, detail }); }
function fail(name, detail) { failures.push({ name, detail }); }
function warn(name, detail) { warnings.push({ name, detail }); }
function check(name, cond, detail = '') { cond ? ok(name, detail) : fail(name, detail); }

/* ------------------------------------------------------------------ */
/* boot                                                                */
/* ------------------------------------------------------------------ */
if (!fs.existsSync(HTML_PATH)) { console.error('index.html not found at ' + HTML_PATH); process.exit(1); }
const html = fs.readFileSync(HTML_PATH, 'utf8');
let env;
try {
  env = boot(html);
  ok('engine boot', 'index.html inline script executed in a stubbed DOM');
} catch (e) {
  console.error('FATAL: engine failed to boot — ' + e.message);
  process.exit(1);
}
const G = env.G;
const N = G.NODES;
const nodeIds = Object.keys(N);
const ENDINGS = nodeIds.filter(id => N[id].type === 'ending');
const BATTLES = nodeIds.filter(id => N[id].type === 'battle');
const WALK = G.WALKDEF;

/* ------------------------------------------------------------------ */
/* 1. node shape                                                       */
/* ------------------------------------------------------------------ */
const shapeProblems = [];
for (const id of nodeIds) {
  const n = N[id];
  if (n.type === 'ending') {
    if (!n.title) shapeProblems.push(id + ': ending without title');
    if (!n.rank) shapeProblems.push(id + ': ending without rank');
    if (!n.text) shapeProblems.push(id + ': ending without text');
    continue;
  }
  if (n.type === 'battle') {
    if (!n.enemy || !n.enemy.name || !n.enemy.hp || !n.enemy.atk) shapeProblems.push(id + ': battle without enemy stats');
    if (!n.win) shapeProblems.push(id + ': battle without win target');
    if (!n.lose) shapeProblems.push(id + ': battle without lose target');
    continue;
  }
  if (!n.text) shapeProblems.push(id + ': node without text');
  if (!Array.isArray(n.choices) || !n.choices.length) shapeProblems.push(id + ': node without choices');
  (n.choices || []).forEach((c, i) => {
    if (!c.t) shapeProblems.push(id + ': choice #' + i + ' without label');
    if (!c.to) shapeProblems.push(id + ': choice #' + i + ' without target');
  });
  (n.alt || []).forEach((a, i) => { if (!a.text) shapeProblems.push(id + ': alt #' + i + ' without text'); });
}
check('node shape', shapeProblems.length === 0, shapeProblems.join('; '));

/* ------------------------------------------------------------------ */
/* 2. references + graph reachability                                  */
/* ------------------------------------------------------------------ */
const HUB = '!walk:';
const dangling = [];

/**
 * Outgoing edges for a node id, or for a walkable scene hub.
 * mode 'graph' keeps every edge (reachability audit); 'win' keeps only battle
 * victories (the harness always fights to win); 'lose' also allows losing,
 * which is the only way into ending_death.
 */
function edgesOf(id, mode = 'graph') {
  if (id.startsWith(HUB)) {
    const def = WALK[id.slice(HUB.length)];
    if (!def) return [];
    const out = (def.gates || []).map(g => ({ to: g.node, need: g.need, walk: id }));
    if (def.end) out.push({ to: def.end.node, walk: id });
    return out;
  }
  const n = N[id];
  if (!n) return [];
  if (n.type === 'battle') {
    if (mode === 'win') return [{ to: n.win, fx: n.winFx, kind: 'battle' }].filter(e => e.to);
    if (mode === 'lose') return [{ to: n.win, fx: n.winFx, kind: 'battle' }, { to: n.lose, fx: n.loseFx, kind: 'lose' }].filter(e => e.to);
    return [
      { to: n.win, fx: n.winFx, kind: 'battle' },
      { to: n.lose, fx: n.loseFx, kind: 'lose' },
      { to: n.retreat, kind: 'retreat' },
    ].filter(e => e.to);
  }
  const out = [];
  (n.choices || []).forEach((c, i) => {
    const t = c.to;
    if (!t) return;
    if (t === '!title') return;
    if (t === '!battle') { if (mode === 'graph') BATTLES.forEach(b => out.push({ to: b, kind: 'replay' })); return; }
    if (t === '!retreat') { if (mode === 'graph') BATTLES.forEach(b => { if (N[b].retreat) out.push({ to: N[b].retreat, kind: 'retreat' }); }); return; }
    if (t.startsWith(HUB)) {
      if (!WALK[t.slice(HUB.length)]) { dangling.push(id + ' -> ' + t + ' (unknown walk scene)'); return; }
      out.push({ to: t, fx: c.fx, cond: c.cond, kind: 'enter-walk', idx: i });
      return;
    }
    if (!N[t]) { dangling.push(id + ' -> ' + t + ' (missing node)'); return; }
    out.push({ to: t, fx: c.fx, cond: c.cond, kind: 'choice', idx: i });
  });
  return out;
}

for (const id of nodeIds) edgesOf(id);
check('no dangling node references', dangling.length === 0, dangling.join('; '));

const reachable = new Set(['p0_signal']);
(function flood() {
  const q = ['p0_signal'];
  while (q.length) {
    const id = q.shift();
    for (const e of edgesOf(id)) if (!reachable.has(e.to)) { reachable.add(e.to); q.push(e.to); }
  }
})();
const unreachable = nodeIds.filter(id => !reachable.has(id));
const easter = unreachable.filter(id => id.startsWith('e0_'));
check('all story nodes reachable from p0_signal', unreachable.length === easter.length,
  'unreachable: ' + unreachable.filter(id => !id.startsWith('e0_')).join(', '));
if (easter.length) {
  const seen = new Set(['e0_wake']); const q = ['e0_wake'];
  while (q.length) { const id = q.shift(); for (const e of edgesOf(id)) if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }
  check('hidden Easter-egg chapter is self-contained', easter.every(id => seen.has(id)), 'broken: ' + easter.filter(id => !seen.has(id)).join(', '));
}
check('every ending is reachable', ENDINGS.every(e => reachable.has(e)), ENDINGS.filter(e => !reachable.has(e)).join(', '));
const ghostWalk = Object.keys(WALK).filter(k => !(edgesOf(HUB + k).length));
check('every walkable scene leads somewhere', ghostWalk.length === 0, ghostWalk.join(', '));
for (const k of Object.keys(WALK)) {
  for (const e of edgesOf(HUB + k)) check('walk scene ' + k + ' -> ' + e.to, !!N[e.to], '');
}

/* ------------------------------------------------------------------ */
/* 3. flags: every condition must have a writer                        */
/* ------------------------------------------------------------------ */
const flagWriters = new Set();
const addFx = fx => { if (!fx) return; if (fx.flag) flagWriters.add(fx.flag); if (fx.flag2) flagWriters.add(fx.flag2); };
for (const id of nodeIds) {
  const n = N[id];
  addFx(n.fx); addFx(n.winFx); addFx(n.loseFx);
  (n.choices || []).forEach(c => addFx(c.fx));
  (n.alt || []).forEach(a => addFx(a.fx));
}
for (const k of Object.keys(WALK)) (WALK[k].gates || []).forEach(g => {
  (g.need || '').split(',').forEach(tok => { const m = tok.trim().match(/^!?flag:([a-z0-9_]+)$/); if (m) flagWriters.add(m[1]); });
});
const flagReaders = new Set();
const readCond = c => { if (!c) return; c.split(',').forEach(tok => { const m = tok.trim().match(/^!?flag:([a-z0-9_]+)$/); if (m) flagReaders.add(m[1]); }); };
for (const id of nodeIds) {
  const n = N[id];
  readCond(n.cond);
  (n.choices || []).forEach(c => readCond(c.cond));
  (n.alt || []).forEach(a => readCond(a.cond));
}
for (const k of Object.keys(WALK)) (WALK[k].gates || []).forEach(g => readCond(g.need));
// Flags may also be read from plain code (achievement checks), not just in cond strings.
for (const m of html.matchAll(/flags\.([a-z0-9_]+)/g)) flagReaders.add(m[1]);
const orphanFlags = [...flagReaders].filter(f => !flagWriters.has(f));
check('every conditional flag has a writer', orphanFlags.length === 0, 'never set: ' + orphanFlags.join(', '));
const deadFlags = [...flagWriters].filter(f => !flagReaders.has(f));
if (deadFlags.length) warn('flags written but never read', deadFlags.join(', '));

/* ------------------------------------------------------------------ */
/* 4. codex / chapters / achievements consistency                      */
/* ------------------------------------------------------------------ */
const codexBad = [];
for (const k of Object.keys(G.CODEX)) {
  const c = G.CODEX[k];
  if (!c.t || !c.body) codexBad.push(k + ': missing title/body');
  (c.u || []).forEach(id => { if (id !== 'start' && !N[id]) codexBad.push(k + ': unlocks on missing node ' + id); });
}
check('codex entries well-formed', codexBad.length === 0, codexBad.join('; '));
const bootAnchored = Object.keys(G.CODEX).filter(k => (G.CODEX[k].u || []).includes('start'));
if (bootAnchored.length) check('title-screen codex bootstrap runs', typeof G.unlockCodexDefault === 'function', bootAnchored.length + ' worldbuilding entries by design');

for (const ck of Object.keys(G.CHAPTERS)) {
  const ch = G.CHAPTERS[ck];
  if (!N[ch.node]) fail('chapter start node exists', ck + ' -> ' + ch.node + ' missing');
}
check('all chapter start nodes exist', Object.keys(G.CHAPTERS).every(ck => !!N[G.CHAPTERS[ck].node]));
check('chapter map targets real nodes', Object.keys(G.CHMAP).every(id => !!N[id]) && Object.values(G.CHMAP).every(ck => !!G.CHAPTERS[ck]), 'CHMAP must map nodeId -> chapterKey');

const endachMissing = ENDINGS.filter(e => !G.ENDACH[e]);
check('every ending maps to an achievement', endachMissing.length === 0, endachMissing.join(', '));
const tagsMissing = ENDINGS.filter(e => !G.TAGS[e]);
check('every ending has a share tagline', tagsMissing.length === 0, tagsMissing.join(', '));
const achOrphan = Object.values(G.ENDACH).filter(a => !G.ACH[a]);
check('ending achievements exist in the achievement table', achOrphan.length === 0, achOrphan.join(', '));

const echoBad = Object.keys(G.ECHO).filter(id => !N[id]);
check('echo (NG+) monologues point at real nodes', echoBad.length === 0, echoBad.join(', '));

/* ------------------------------------------------------------------ */
/* 5. README / docs consistency                                        */
/* ------------------------------------------------------------------ */
const readme = fs.existsSync(path.join(ROOT, 'README.md')) ? fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8') : '';
const readmeZh = fs.existsSync(path.join(ROOT, 'README.zh-CN.md')) ? fs.readFileSync(path.join(ROOT, 'README.zh-CN.md'), 'utf8') : '';
if (readme) {
  check('README has no <your-name> placeholder', !readme.includes('<your-name>'), 'replace with the real Pages URL');
  const mEnd = readme.match(/\*\*(\d+) endings\*\*/) || readme.match(/(\d+)\s+endings/);
  if (mEnd) check('README ending count matches code', +mEnd[1] === ENDINGS.length, 'README says ' + mEnd[1] + ', code has ' + ENDINGS.length);
  const mAch = readme.match(/\*\*(\d+) achievements\*\*/) || readme.match(/(\d+)\s+achievements/);
  if (mAch) check('README achievement count matches code', +mAch[1] === Object.keys(G.ACH).length, 'README says ' + mAch[1] + ', code has ' + Object.keys(G.ACH).length);
  const mNodes = readme.match(/(\d+)\s+story nodes/);
  if (mNodes) check('README story-node count matches code', +mNodes[1] === Object.keys(N).filter(i => !N[i].type).length, 'README says ' + mNodes[1] + ', code has ' + Object.keys(N).filter(i => !N[i].type).length);
  const sizeMatch = readme.match(/~?\s*(\d+)\s*KB/);
  if (sizeMatch) {
    const actual = Math.round(Buffer.byteLength(html) / 1024);
    check('README size claim matches file', Math.abs(actual - +sizeMatch[1]) <= 12, 'README says ~' + sizeMatch[1] + ' KB, file is ' + actual + ' KB');
  }
}
if (readmeZh) {
  const zAch = readmeZh.match(/(\d+)\s*个成就/);
  if (zAch) check('README.zh-CN achievement count matches code', +zAch[1] === Object.keys(G.ACH).length, 'zh README says ' + zAch[1] + ', code has ' + Object.keys(G.ACH).length);
  const zEnd = readmeZh.match(/(\d+)\s*个结局/);
  if (zEnd) check('README.zh-CN ending count matches code', +zEnd[1] === ENDINGS.length, 'zh README says ' + zEnd[1] + ', code has ' + ENDINGS.length);
  check('README.zh-CN has no <your-name> placeholder', !readmeZh.includes('<your-name>'), '');
}
const changelog = fs.existsSync(path.join(ROOT, 'CHANGELOG.md')) ? fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8') : '';
check('CHANGELOG is present', !!changelog, '');

/* pwa / offline assets, if they exist, must be self-consistent */
const swPath = path.join(ROOT, 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  const listed = [...sw.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]).filter(f => f && !f.endsWith('/'));
  const missing = listed.filter(f => !fs.existsSync(path.join(ROOT, f)));
  check('service worker precache list resolves', missing.length === 0, 'missing: ' + missing.join(', '));
  check('service worker bumps its cache name', /CACHE\s*=\s*['"][^'"]*v\d+/.test(sw), 'no version in cache name');
}
if (fs.existsSync(path.join(ROOT, 'manifest.webmanifest'))) {
  try { const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
    check('manifest is valid JSON with required fields', !!(mf.name && mf.start_url && mf.icons && mf.icons.length), '');
    const badIcon = (mf.icons || []).map(i => i.src.replace(/^\.\//, '')).filter(src => !fs.existsSync(path.join(ROOT, src)));
    check('manifest icons exist on disk', badIcon.length === 0, badIcon.join(', '));
  } catch (e) { fail('manifest is valid JSON with required fields', e.message); }
}

/* ------------------------------------------------------------------ */
/* 6. save / settings round-trip                                       */
/* ------------------------------------------------------------------ */
try {
  G.save();
  const raw = env.localStorage.getItem(G.SAVEK);
  check('save() writes the canonical key', !!raw, '');
  const saved = JSON.parse(raw);
  saved.node = 'p0_scan'; saved.o2 = 42; saved.hp = 77;
  env.localStorage.setItem(G.SAVEK, JSON.stringify(saved));
  const loaded = G.loadSave();
  check('loadSave() restores a session', loaded === true && G.S.node === 'p0_scan' && G.S.o2 === 42, 'node=' + G.S.node);
  env.localStorage.setItem(G.SAVEK, '{"node":"does_not_exist"}');
  check('loadSave() rejects unknown nodes', G.loadSave() === false, '');
  env.localStorage.setItem(G.SAVEK, '{not json');
  check('loadSave() survives corrupt JSON', G.loadSave() === false, '');
  G.clearSave();
  check('clearSave() empties the slot', env.localStorage.getItem(G.SAVEK) === null, '');
  G.CFG.speed = 3; G.CFG.quality = 'low'; G.saveCfg();
  check('settings persist', JSON.parse(env.localStorage.getItem(G.SETK)).speed === 3, '');
} catch (e) { fail('save / settings round-trip', e.message); }

/* ------------------------------------------------------------------ */
/* 7. real playthroughs: drive the engine to all outcomes               */
/* ------------------------------------------------------------------ */
function flagsAfter(flags, fx) {
  const out = new Set(flags);
  if (!fx) return out;
  if (fx.flag) out.add(fx.flag);
  if (fx.flag2) out.add(fx.flag2);
  if (fx.unflag) out.delete(fx.unflag);
  return out;
}

/** Static cond evaluation; resource gates (o2/en/hp) are assumed survivable and re-checked live. */
function condHolds(cond, flags, res) {
  if (!cond) return true;
  return cond.split(',').every(tok => {
    tok = tok.trim();
    if (!tok) return true;
    const m = tok.match(/^!?flag:([a-z0-9_]+)$/);
    if (m) return tok.startsWith('!') ? !flags.has(m[1]) : flags.has(m[1]);
    const cmp = tok.match(/^([a-z_]+)\s*(>=|<=|==|!=|>|<)\s*(-?\d+)$/);
    if (cmp) {
      const v = res ? (res[cmp[1]] ?? 0) : 0;
      const n = Number(cmp[3]);
      switch (cmp[2]) {
        case '>=': return v >= n;
        case '<=': return v <= n;
        case '>': return v > n;
        case '<': return v < n;
        case '==': return v === n;
        case '!=': return v !== n;
      }
    }
    return true;
  });
}

/** Apply a node/choice fx block to a resource vector (en/hp/o2 clamped like the engine). */
function applyRes(res, fx, items) {
  const out = { ...res };
  if (!fx) return out;
  for (const k of ['o2', 'hp', 'en']) if (typeof fx[k] === 'number') out[k] += fx[k];
  if (fx.item && items) items[fx.item] = (items[fx.item] || 0) + 1;
  out.o2 = Math.max(0, Math.min(100, out.o2));
  out.hp = Math.max(0, Math.min(130, out.hp));
  out.en = Math.max(0, Math.min(200, out.en));
  return out;
}

/**
 * Cost of a fight, simulated turn by turn: one scan, then scanned shoots
 * (≈39 dmg / 12 EN), accounting for healing and energy-drain skills.
 */
function battleCost(n) {
  const e = n.enemy;
  let hp = e.hp, en = 8, turn = 0;
  while (hp > 0 && turn < 40) {
    hp -= 39; en += 12; turn++;
    if (e.skill && turn % e.skill.every === 0) {
      if (e.skill.heal) hp += e.skill.heal;
      if (e.skill.drain) en += e.skill.drain;
    }
  }
  return { en, hp: (turn + 1) * (e.atk + 3) };
}

function dominates(a, b) { return a.o2 >= b.o2 && a.en >= b.en; }

/**
 * Resource-aware BFS over (node, flag-set) with Pareto pruning on (o2, hp, en).
 * Walkable scenes are re-enterable hubs; fights are modelled by their expected
 * energy/HP cost so routes that would strand the player are pruned early.
 */
function planTo(target) {
  const keyOf = (id, fl) => id + '|' + [...fl].sort().join(',');
  const startRes = { o2: 100, hp: 100, en: 100 };
  const startItems = { bat: 0, o2can: 0 };
  const frontier = new Map();
  frontier.set(keyOf('p0_signal', new Set()), [startRes]);
  const q = [{ node: 'p0_signal', flags: new Set(), res: startRes, items: startItems, plan: [] }];
  const mode = target === 'ending_death' ? 'lose' : 'win';
  let guard = 0;
  let best = null;
  while (q.length && guard++ < 800000) {
    const cur = q.shift();
    if (cur.node === target) {
      // Keep searching: a later arrival may leave more energy for the endgame.
      if (!best || !dominates(best.res, cur.res)) best = { res: cur.res, plan: cur.plan };
      continue;
    }
    const n = N[cur.node];
    if (n && n.type === 'ending') continue;
    if (cur.res.o2 <= 0 || cur.res.hp <= 0) continue;

    for (const e of edgesOf(cur.node, mode)) {
      if (e.cond && !condHolds(e.cond, cur.flags, cur.res)) continue;
      if (e.need && !condHolds(e.need, cur.flags, cur.res)) continue;

      let res = applyRes(cur.res, e.fx, cur.items);
      let items = { ...cur.items };
      // A fight edge points at the victory node; the fight itself is cur.node.
      const fight = (e.kind === 'battle' || e.kind === 'lose') ? N[cur.node] : null;
      const need = N[e.to];
      if (fight && fight.enemy) {
        const cost = battleCost(fight);
        let en = res.en - cost.en;
        while (en < 0 && items.bat > 0) { items.bat--; en = Math.min(200, en + 25); }
        // A shield cycle heals 25 per enemy hit of ≤~24, so HP is recoverable
        // given the energy; only the energy budget is a hard constraint.
        res = { ...res, en, hp: 130 };
      } else if (need && need.type !== 'ending') {
        res = applyRes(res, need.fx, items);
      }
      if (mode !== 'lose' && (res.hp <= 0 || res.o2 <= 0)) continue;
      let flags = flagsAfter(cur.flags, e.fx);
      if (need && need.fx) flags = flagsAfter(flags, need.fx);
      const k = keyOf(e.to, flags);
      const bucket = frontier.get(k) || [];
      if (bucket.some(r => dominates(r, res))) continue;
      frontier.set(k, bucket.filter(r => !dominates(res, r)).concat([res]));
      q.push({ node: e.to, flags, res, items, plan: [...cur.plan, { from: cur.node, res, ...e }] });
    }
  }
  return best && best.plan;
  return null;
}

function freshEnv() { return boot(html, { seed: 424242 }); }

/** Drive the real engine along a plan. Returns { ending, path, log }. */
function runPlan(target) {
  const plan = planTo(target);
  if (!plan) return { error: 'no plan found for ' + target };
  const e2 = freshEnv();
  const g2 = e2.G;
  const trace = [];
  g2.showNode('p0_signal');
  e2.flush();
  const clickIdx = i => {
    const box = e2.document.querySelector('#choices');
    const btn = box.children[i];
    if (!btn) throw new Error('missing choice #' + i + ' at ' + g2.S.node);
    if (btn.disabled) throw new Error('choice #' + i + ' is disabled at ' + g2.S.node);
    btn.onclick();
    e2.flush();
  };
  const autoBattle = (battleId, suicidal = false) => {
    const bossSkill = (N[battleId] && N[battleId].enemy && N[battleId].enemy.skill) || {};
    let rounds = 0;
    while (g2.S.node === battleId && g2.S.curEnding === null && rounds++ < 300) {
      const bs = g2.getBS && g2.getBS();
      if (!bs) break;
      if (bs.busy) { e2.flush(); continue; }
      const en = g2.S.en;
      // Suicidal run: waste turns on scans so the enemy actually lands hits.
      if (suicidal) {
        if (g2.S.en >= 8) g2.act('scan');
        else if (g2.S.items.bat > 0) g2.useItem('bat');
        else g2.act('shield');
        e2.flush();
        continue;
      }
      // Damage-per-energy is best on a scanned shoot (≈39 dmg / 12 EN);
      // overload (≈81 / 28) is strictly worse, so it is never used.
      // Shields net +9 HP per enemy swing, so top up before committing energy.
      if (!bossSkill.drain && g2.S.hp < 105 && en >= 44) { g2.act('shield'); e2.flush(); continue; }
      if (!bs.scanned && en >= 8) g2.act('scan');
      else if (en >= 12) g2.act('shoot');
      else if (g2.S.items.bat > 0) g2.useItem('bat');
      else if (g2.S.hp <= 90 && g2.S.items.o2can > 0) g2.useItem('o2can');
      else g2.act('shield');
      e2.flush();
    }
    if (rounds >= 300) throw new Error('battle did not resolve: ' + battleId);
  };
  try {
  for (let si = 0; si < plan.length; si++) {
    const step = plan[si];
    const nextKind = plan[si + 1] && plan[si + 1].kind;
    trace.push({ from: step.from, to: step.to, kind: step.kind || 'walk-step' });
    if (process.env.DSE_TRACE) console.log('   >> pre=' + g2.S.node + ' plan.from=' + step.from + ' plan.to=' + step.to + ' kind=' + (step.kind || (step.walk ? 'hub' : '?')));
    if (step.kind === 'battle' || step.kind === 'lose') { autoBattle(step.from, step.kind === 'lose'); continue; }
    if (step.kind === 'replay') { autoBattle(step.to, false); continue; }
    if (step.kind === 'enter-walk') continue; // hub transition; resolved by the next step
    if (step.kind === 'retreat' || step.walk) {
      // 3D walking is interactive; jump straight to the gate the plan picked.
      g2.go(step.to); e2.flush(); continue;
    }
    clickIdx(step.idx);
    if (N[g2.S.node] && N[g2.S.node].type === 'battle' && nextKind !== 'lose') autoBattle(g2.S.node, false);
    if (process.env.DSE_TRACE) {
      const kids = e2.document.querySelector('#choices').children;
      console.log('   step ' + (trace.length - 1) + ' ' + (step.kind || 'walk') + ' ' + step.from + ' -> ' + step.to +
        ' | now=' + g2.S.node + ' o2=' + g2.S.o2 + ' hp=' + g2.S.hp +
        ' | btns=[' + [...kids].map(k => (k.innerHTML || '').replace(/<[^>]+>/g, '').slice(0, 8)).join(' / ') + ']');
    }
  }
  } catch (err) {
    if (process.env.DSE_RES) {
      const last = plan[plan.length - 1];
      console.log('   [res] ' + target + ' FAIL real en=' + g2.S.en);
      console.log('   [plan] ' + plan.map((p, i) => i + ':' + (p.kind || 'hub') + '>' + p.to + ' en' + (p.res && p.res.en)).join(' '));
    }
    throw err;
  }
  return { ending: g2.S.curEnding, node: g2.S.node, trace, o2: g2.S.o2, hp: g2.S.hp, en: g2.S.en };
}

if (!QUICK) {
  for (const target of ENDINGS) {
    let res;
    try { res = runPlan(target); }
    catch (e) { fail('playthrough → ' + target, e.message); continue; }
    if (res.error) { fail('playthrough → ' + target, res.error); continue; }
    if (res.ending === target) ok('playthrough → ' + target, res.trace.length + ' steps, o2=' + res.o2 + ' hp=' + res.hp + ' en=' + res.en);
    else fail('playthrough → ' + target, 'wound up at ' + (res.ending || res.node || 'unknown') + ' after ' + res.trace.length + ' steps');
  }

  /* a second lap with NG+ echo mode enabled must not break anything */
  try {
    const e3 = boot(html, { storage: { deep_space_echoes_echo_v1: '1' }, seed: 7 });
    e3.G.showNode('p0_signal'); e3.flush();
    check('echo mode boots and renders', e3.G.S.node === 'p0_signal', '');
  } catch (e) { fail('echo mode boots and renders', e.message); }
}

/* ------------------------------------------------------------------ */
/* 8. content volume                                                   */
/* ------------------------------------------------------------------ */
const words = nodeIds.reduce((n, id) => n + (N[id].text || '').replace(/\s+/g, '').length, 0);
const choiceCount = nodeIds.reduce((n, id) => n + ((N[id].choices || []).length), 0);

/* ------------------------------------------------------------------ */
/* report                                                              */
/* ------------------------------------------------------------------ */
const summary = {
  ok: failures.length === 0,
  passed: passes.length,
  failed: failures.length,
  warned: warnings.length,
  stats: {
    nodes: nodeIds.length,
    storyNodes: nodeIds.filter(i => !N[i].type).length,
    endings: ENDINGS.length,
    battles: BATTLES.length,
    achievements: Object.keys(G.ACH).length,
    codex: Object.keys(G.CODEX).length,
    walkScenes: Object.keys(WALK).length,
    echoLines: Object.keys(G.ECHO).length,
    choices: choiceCount,
    characters: words,
    sizeKB: Math.round(Buffer.byteLength(html) / 1024),
  },
  failures, warnings,
};

if (JSON_OUT) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('\nEchoes of Deep Space — regression report');
  console.log('='.repeat(56));
  for (const p of passes) console.log('  PASS  ' + p.name + (p.detail ? '  ·  ' + p.detail : ''));
  for (const w of warnings) console.log('  WARN  ' + w.name + (w.detail ? '  ·  ' + w.detail : ''));
  for (const f of failures) console.log('  FAIL  ' + f.name + (f.detail ? '  ·  ' + f.detail : ''));
  const s = summary.stats;
  console.log('-'.repeat(56));
  console.log(`  ${s.nodes} nodes (${s.storyNodes} story) · ${s.endings} endings · ${s.battles} battles · ${s.achievements} achievements`);
  console.log(`  ${s.codex} codex entries · ${s.walkScenes} walkable scenes · ${s.echoLines} echo lines · ${s.choices} choices · ${s.characters} chars · ${s.sizeKB} KB`);
  console.log('-'.repeat(56));
  console.log(`  ${summary.ok ? 'ALL CHECKS PASSED' : 'FAILURES: ' + failures.length}  (${passes.length} passed, ${warnings.length} warnings)`);
  console.log('='.repeat(56) + '\n');
}
process.exit(summary.ok ? 0 : 1);
