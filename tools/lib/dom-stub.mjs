/**
 * Minimal DOM / Canvas / WebAudio stub so that the whole single-file game
 * (index.html) can be executed inside Node for regression testing.
 *
 * Design goals:
 *  - Zero dependencies (project rule: no third-party packages, ever).
 *  - Deterministic: fake timers, seeded Math.random, in-memory localStorage.
 *  - Forgiving: unknown Canvas 2D / Audio APIs become no-ops instead of crashes.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

/* ----------------------------- fake timers ----------------------------- */
export class FakeTimers {
  constructor() { this.now = 0; this.seq = 1; this.tasks = new Map(); }
  setTimeout(fn, ms = 0) {
    const id = this.seq++;
    this.tasks.set(id, { fn, at: this.now + ms, every: null });
    return id;
  }
  setInterval(fn, ms = 0) {
    const id = this.seq++;
    this.tasks.set(id, { fn, at: this.now + ms, every: Math.max(1, ms) });
    return id;
  }
  clear(id) { this.tasks.delete(id); }
  /**
   * Advance virtual time by `horizonMs`, firing every timer that comes due.
   * Periodic timers (the generative soundtrack) are capped by the horizon so
   * a self-scheduling loop can never hang the harness.
   */
  drain(horizonMs = 20000) {
    const end = this.now + horizonMs;
    let steps = 0;
    while (steps++ < 100000) {
      let bestId = null, bestAt = Infinity;
      for (const [id, t] of this.tasks) {
        if (t.at <= end && t.at < bestAt) { bestAt = t.at; bestId = id; }
      }
      if (bestId === null) break;
      const t = this.tasks.get(bestId);
      this.now = Math.max(this.now, t.at);
      if (t.every == null) this.tasks.delete(bestId);
      else t.at = this.now + t.every;
      try { t.fn(); } catch (e) { throw new Error('timer callback threw: ' + e.message); }
    }
    if (steps >= 100000) throw new Error('timer drain exceeded 100k callbacks');
  }
  get pending() { return this.tasks.size; }
}

/* ----------------------------- canvas 2D ----------------------------- */
function makeGradient() { return { addColorStop() {} }; }
function makeCtx2D(canvas) {
  const noop = () => {};
  const base = {
    canvas,
    createLinearGradient: makeGradient,
    createRadialGradient: makeGradient,
    measureText: () => ({ width: 12 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
    toDataURL: () => 'data:image/png;base64,',
  };
  return new Proxy(base, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: (t, k, v) => { t[k] = v; return true; },
  });
}

/* ----------------------------- elements ----------------------------- */
class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach(x => this.set.add(x)); }
  remove(...c) { c.forEach(x => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, on) { const v = on === undefined ? !this.set.has(c) : !!on; v ? this.set.add(c) : this.set.delete(c); return v; }
}

class Element {
  constructor(tag = 'div', doc = null) {
    this.tagName = String(tag).toUpperCase();
    this._doc = doc;
    this.children = [];
    this.childNodes = this.children;
    this.style = {};
    this.classList = new ClassList();
    this.dataset = {};
    this.attributes = {};
    this._text = '';
    this._html = '';
    this.value = '';
    this.disabled = false;
    this.checked = false;
    this.scrollTop = 0;
    this.scrollHeight = 100;
    this.offsetWidth = 100;
    this.offsetHeight = 100;
    this.width = 390;
    this.height = 844;
    this.clientWidth = 390;
    this.clientHeight = 844;
    this._listeners = {};
    this.onclick = null;
    this.oninput = null;
    this.onchange = null;
  }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); this._html = ''; this.children.length = 0; }
  get innerHTML() { return this._html; }
  set innerHTML(v) {
    this._html = String(v);
    if (this._html === '') this.children.length = 0;
  }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  insertBefore(c) { this.children.unshift(c); c.parentNode = this; return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  remove() { this.parentNode?.removeChild?.(this); }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(t, fn) { (this._listeners[t] ||= []).push(fn); }
  removeEventListener(t, fn) { const a = this._listeners[t] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }
  dispatch(t, ev = {}) { (this._listeners[t] || []).forEach(fn => fn(ev)); }
  querySelector(sel) { return this._doc ? this._doc.querySelector(sel) : null; }
  querySelectorAll(sel) { return this._doc ? this._doc.querySelectorAll(sel) : []; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844, x: 0, y: 0 }; }
  getContext() { return (this._ctx ||= makeCtx2D(this)); }
  focus() {} blur() {} click() { this.onclick && this.onclick({}); } scrollIntoView() {}
  closest() { return this.parentNode || null; }
  contains() { return false; }
}

class Document {
  constructor() {
    this._cache = new Map();
    this.body = new Element('body', this);
    this.head = new Element('head', this);
    this.documentElement = new Element('html', this);
    this.fullscreenElement = null;
    this._listeners = {};
  }
  querySelector(sel) {
    if (!this._cache.has(sel)) {
      const el = new Element('div', this);
      // The game ships its battle controls as static markup; the stub has no
      // HTML parser, so pre-populate the containers the engine indexes into.
      if (sel === '#bActs') for (let i = 0; i < 4; i++) el.appendChild(new Element('button', this));
      if (sel === '#bItems') for (let i = 0; i < 2; i++) el.appendChild(new Element('button', this));
      this._cache.set(sel, el);
    }
    return this._cache.get(sel);
  }
  querySelectorAll() { return []; }
  createElement(tag) { return new Element(tag, this); }
  createTextNode(t) { const e = new Element('#text', this); e.textContent = t; return e; }
  addEventListener(t, fn) { (this._listeners[t] ||= []).push(fn); }
  removeEventListener() {}
  exitFullscreen() { return Promise.resolve(); }
  webkitExitFullscreen() {}
  execCommand() { return true; }
}

function makeAudioStub() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  const node = () => ({
    connect() { return this; }, disconnect() {}, start() {}, stop() {},
    gain: param(), frequency: param(), detune: param(), Q: param(),
    type: 'sine', buffer: null, loop: false,
    onended: null,
  });
  return class AudioContextStub {
    constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running'; this.destination = node(); }
    createGain() { return node(); } createOscillator() { return node(); }
    createBiquadFilter() { return node(); } createBufferSource() { return node(); }
    createBuffer() { return { getChannelData: () => new Float32Array(1024) }; }
    createDynamicsCompressor() { return node(); } createStereoPanner() { return node(); }
    resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  };
}

function makeStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: k => { map.delete(String(k)); },
    clear: () => map.clear(),
    key: i => [...map.keys()][i] ?? null,
    get length() { return map.size; },
    _dump: () => Object.fromEntries(map),
    _seed: obj => { Object.entries(obj).forEach(([k, v]) => map.set(k, String(v))); },
  };
}

function seededRandom(seed = 20260101) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * Boot the game engine from a built index.html.
 * @param {string} html  full HTML source
 * @param {{storage?:object, seed?:number}} opts
 */
export function boot(html, opts = {}) {
  const timers = new FakeTimers();
  const document = new Document();
  const localStorage = makeStorage();
  if (opts.storage) localStorage._seed(opts.storage);
  const AudioCtx = makeAudioStub();
  const errors = [];

  const win = {
    document,
    localStorage,
    navigator: { clipboard: undefined, getGamepads: () => [], userAgent: 'node-smoke-test' },
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    AudioContext: AudioCtx, webkitAudioContext: AudioCtx,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout: (fn, ms) => timers.setTimeout(fn, ms),
    clearTimeout: id => timers.clear(id),
    setInterval: (fn, ms) => timers.setInterval(fn, ms),
    clearInterval: id => timers.clear(id),
    addEventListener: () => {}, removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    alert: () => {}, confirm: () => true, prompt: () => null,
    location: { href: 'http://localhost/', reload() {} },
    performance: { now: () => timers.now },
    console,
    Math: Object.create(Math, {}),
  };
  win.window = win; win.self = win; win.globalThis = win;
  win.Math.random = seededRandom(opts.seed);

  const sandbox = Object.assign(Object.create(null), win, {
    globalThis: win, window: win, document, localStorage,
    navigator: win.navigator, console,
    setTimeout: win.setTimeout, clearTimeout: win.clearTimeout,
    setInterval: win.setInterval, clearInterval: win.clearInterval,
    requestAnimationFrame: win.requestAnimationFrame, cancelAnimationFrame: win.cancelAnimationFrame,
    AudioContext: AudioCtx, webkitAudioContext: AudioCtx,
    matchMedia: win.matchMedia, addEventListener: win.addEventListener,
    alert: win.alert, location: win.location, performance: win.performance,
    Date, JSON, Math: win.Math, Error, Promise, Map, Set, WeakMap, Float32Array,
    Uint8Array, Uint8ClampedArray, Array, Object, String, Number, Boolean,
    isNaN, parseInt, parseFloat, Infinity, NaN, undefined,
  });

  const ctx = vm.createContext(sandbox);

  // Extract inline <script> blocks (the game ships exactly one).
  const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocks.length) throw new Error('no inline <script> found in HTML');
  const code = blocks.join('\n;\n');
  const exported = `
;globalThis.__G__ = {
  NODES, ACH, CODEX, ECHO, S, FX, CHMAP, CHAPTERS, WALKDEF, ENDACH, TAGS, MU_PAD, CFG,
  go, showNode, renderChoices, startBattle, act, useItem, enemyTurn,
  showEnding, showTitle, condOk, applyFx, save, loadSave, clearSave, updateHud,
  loadEndings, saveCfg, echoOn, getAch, unlockAch, genCard,
  unlockCodex, unlockCodexDefault, getCodex, unlockChapter,
  SAVEK, ENDK, BESTK, TOTK, SETK, ACHK, ECHOK, CODEXX, CHK,
  getBS: () => BS, getWALK: () => WALK, getEndings: () => loadEndings(),
  // image fns
};`;

  vm.runInContext(code + exported, ctx, { filename: 'index.html#inline-script', timeout: 20000 });

  return {
    G: win.__G__,
    document,
    localStorage,
    timers,
    errors,
    /** Drain pending fake timers (typewriter, battle delays, toasts). */
    flush(budget) { timers.drain(budget); },
    /** Simulated user click on the n-th visible choice button. */
    clickChoice(list, index) {
      const btn = list && list[index];
      if (!btn) throw new Error('choice button #' + index + ' not present');
      btn.onclick();
      timers.drain();
      return btn;
    },
  };
}

export function readHtml(file) { return fs.readFileSync(file, 'utf8'); }
export const rootOf = p => path.resolve(p);
