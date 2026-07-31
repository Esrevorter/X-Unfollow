// ==UserScript==
// @name         X.com Safe Unfollow (Humanized v7.3)
// @namespace    http://tampermonkey.net/
// @version      7.3
// @description  Fully configurable empty page tolerance
// @author       You
// @match        https://x.com/*/following
// @match        https://twitter.com/*/following
// @grant        GM_addStyle
// 
// @downloadURL  https://example.com/script.user.js
// @updateURL    https://example.com/script.meta.js
// 
// ==/UserScript==

/**
 * X.com Safe Unfollow Script v7.3
 * 
 * A sophisticated Tampermonkey userscript for safely and efficiently unfollowing 
 * accounts on X.com (formerly Twitter). This script prioritizes human-like behavior 
 * patterns to minimize detection risk while providing full configurability and 
 * real-time progress tracking.
 * 
 * @module XUnfollow
 * @version 7.3
 * @author Community Contributor
 * 
 * @features
 *   - Bidirectional sorting (oldest/newest first)
 *   - Configurable unfollow limits and delays
 *   - Humanized click simulation with mouse events
 *   - Robust modal detection and handling
 *   - Progress tracking with ETA estimation
 *   - Detailed color-coded logging
 *   - Draggable, collapsible UI panel
 *   - Settings persistence via localStorage
 *   - Empty page tolerance for smart stopping
 *   - Anti-detection measures (randomized timing, varied scrolls)
 * 
 * @safety
 *   - Skips users who follow you back
 *   - Validates username in confirmation modal
 *   - Prevents duplicate processing
 *   - Automatic retry on failures (max 3 attempts)
 *   - Progressive backoff for stuck states
 * 
 * @see {@link https://www.tampermonkey.net/} for installation instructions
 * @see README.md for complete documentation
 * 
 * @warning Use at your own risk. May violate X.com Terms of Service.
 */

(function() {
    'use strict';

    GM_addStyle(`
        #xuf{--b:#1d9bf0;--ok:#00ba7c;--err:#f4212e;--warn:#ffd400;--mut:#8b98a5;--ink:#e7e9ea;--panel:rgba(13,17,23,.92);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
        #xuf *{box-sizing:border-box}
        #xuf input[type="number"]{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:var(--ink);border-radius:9px;padding:7px 8px;font-size:13px;width:100%;outline:none;transition:border-color .2s,background .2s;font-variant-numeric:tabular-nums}
        #xuf input[type="number"]:focus{border-color:var(--b);background:rgba(29,155,240,.08)}
        #xuf input[type="number"]:disabled{opacity:.45;cursor:not-allowed}
        #xuf .lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin-bottom:5px;display:block;font-weight:600}
        #xuf .lab .hint{font-weight:400;text-transform:none;font-size:9px;color:var(--mut);margin-left:4px}
        #xuf .tog{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:7px 10px}
        #xuf .tog span{font-size:12px;color:var(--ink);font-weight:500}
        #xuf input[type="checkbox"]{appearance:none;width:34px;height:18px;background:#3a4047;border-radius:9px;position:relative;cursor:pointer;transition:.25s;flex:none}
        #xuf input[type="checkbox"]::before{content:'';position:absolute;width:14px;height:14px;border-radius:50%;top:2px;left:2px;background:#fff;transition:.25s}
        #xuf input[type="checkbox"]:checked{background:var(--b)}
        #xuf input[type="checkbox"]:checked::before{left:18px}
        #xuf input[type="checkbox"]:disabled{opacity:.45;cursor:not-allowed}
        #xuf .accent{height:2px;width:100%;background:linear-gradient(90deg,var(--b),#19c8b4,var(--b));background-size:200% 100%;animation:xuf-slide 3.5s linear infinite}
        #xuf.run .accent{animation-duration:1.1s}
        @keyframes xuf-slide{to{background-position:200% 0}}
        #xuf .hdr{padding:11px 14px;display:flex;align-items:center;gap:8px;cursor:grab;user-select:none;border-bottom:1px solid rgba(255,255,255,.08)}
        #xuf .hdr:active{cursor:grabbing}
        #xuf .dot{width:8px;height:8px;border-radius:50%;background:var(--mut);flex:none;transition:background .3s}
        #xuf.run .dot{background:var(--ok);animation:xuf-pulse 1.1s ease-in-out infinite}
        @keyframes xuf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
        #xuf .ttl{font-weight:700;font-size:14px;letter-spacing:-.01em;color:var(--ink);flex:1}
        #xuf .ttl b{color:var(--b)}
        #xuf .ver{font-size:10px;color:var(--mut);font-variant-numeric:tabular-nums}
        #xuf .chev{background:none;border:none;color:var(--mut);cursor:pointer;font-size:13px;line-height:1;padding:2px 4px;border-radius:6px;transition:.2s}
        #xuf .chev:hover{color:var(--ink);background:rgba(255,255,255,.08)}
        #xuf.collapsed .body{display:none}
        #xuf .grid{padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;border-bottom:1px solid rgba(255,255,255,.08)}
        #xuf .prog{padding:12px 14px}
        #xuf .prow{font-size:12px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;color:var(--mut)}
        #xuf .prow .st{color:var(--ink);font-weight:500}
        #xuf .cnt{font-variant-numeric:tabular-nums;color:var(--mut)}
        #xuf .track{position:relative;width:100%;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}
        #xuf .fill{height:100%;width:0%;background:var(--b);border-radius:3px;transition:width .45s cubic-bezier(.4,0,.2,1)}
        #xuf .sheen{position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)}
        #xuf.run .sheen{animation:xuf-sheen 1.6s ease-in-out infinite}
        @keyframes xuf-sheen{to{transform:translateX(100%)}}
        #xuf .btn{display:block;width:calc(100% - 28px);margin:0 14px 12px;padding:11px;background:var(--b);color:#fff;border:none;border-radius:22px;cursor:pointer;font-weight:700;font-size:14px;letter-spacing:.01em;transition:transform .12s,filter .2s,background .25s,box-shadow .3s;box-shadow:0 4px 14px rgba(29,155,240,.25)}
        #xuf .btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        #xuf .btn:active{transform:scale(.98)}
        #xuf .btn.stop{background:var(--err);box-shadow:0 4px 14px rgba(244,33,46,.3)}
        #xuf.run{box-shadow:0 12px 44px rgba(0,0,0,.6),0 0 0 1px rgba(0,186,124,.35),0 0 26px rgba(0,186,124,.12)}
        #xuf .log{max-height:210px;overflow-y:auto;background:rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.08);padding:8px 12px;font-size:11px;line-height:1.5;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
        #xuf .log::-webkit-scrollbar{width:6px}#xuf .log::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        #xuf .le{margin-bottom:3px;padding-bottom:3px;border-bottom:1px solid rgba(255,255,255,.04);word-break:break-word;animation:xuf-in .28s ease both}
        @keyframes xuf-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        #xuf .status-indicator{display:inline-block;font-size:10px;margin-left:8px;color:var(--mut)}
        #xuf .scroll-dir{font-size:10px;color:var(--mut);margin-left:4px}
        #xuf .empty-count{font-size:9px;color:var(--mut);margin-left:6px;background:rgba(255,255,255,.05);padding:0 6px;border-radius:8px}
        #xuf .grid-full{grid-column:1/-1}
    `);

    // ========================================
    // CONFIGURATION & STATE MANAGEMENT
    // ========================================
    
    /**
     * Default configuration values
     * @type {Object}
     * @property {number} limit - Maximum unfollows per session (1-1000)
     * @property {number} minDelay - Minimum delay between actions in seconds (3-60)
     * @property {number} maxDelay - Maximum delay between actions in seconds (5-120)
     * @property {boolean} oldestFirst - Sort order: true=oldest, false=newest
     * @property {number} emptyTolerance - Pages with no targets before stopping (1-999)
     */
    const DEFAULTS = { 
        limit: 50, 
        minDelay: 8, 
        maxDelay: 15, 
        oldestFirst: true,
        emptyTolerance: 50 
    };
    
    /**
     * LocalStorage keys for persistence
     * @constant {string}
     */
    const LS_POS = 'xuf_pos_v73', LS_COL = 'xuf_col_v73', LS_CFG = 'xuf_cfg_v73';
    
    // ========================================
    // RUNTIME STATE VARIABLES
    // ========================================
    
    let unfollowCount = 0,           // Successful unfollows in current session
        currentLimit = DEFAULTS.limit, // Active session limit
        isRunning = false,            // Script execution state
        shouldStop = false;           // Stop request flag
    
    let processed = new Set(),        // Usernames already handled (prevents duplicates)
        scannedCount = 0,             // Total cells examined
        startTime = 0;                // Session start timestamp
    
    let scrollDirection = 'down';     // Current scroll direction
    let consecutiveEmptyPages = 0;    // Counter for empty scroll results
    let totalScrolledPages = 0;       // Total pages scrolled in session
    let emptyTolerance = DEFAULTS.emptyTolerance; // Tolerance threshold
    
    const MAX_RETRIES = 3;            // Maximum click retry attempts
    const SCROLL_FRACTIONS = [0.4, 0.5, 0.6, 0.7, 0.8]; // Varied scroll distances
    
    /**
     * WeakMap cache for DOM queries to reduce reflows
     * Stores username and button references per user cell
     * @type {WeakMap<Element, {username?: string, button?: Element}>}
     */
    const domCache = new WeakMap();
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Safely retrieves a value from localStorage
     * @param {string} k - Storage key
     * @returns {string|null} Stored value or null if error/not found
     */
    const lsGet = k => { try { return localStorage.getItem(k); } catch(e){ return null; } };
    
    /**
     * Safely stores a value in localStorage
     * @param {string} k - Storage key
     * @param {string} v - Value to store
     */
    const lsSet = (k,v) => { try { localStorage.setItem(k,v); } catch(e){} };
    
    // Load saved configuration from localStorage
    let savedCfg = null; try { savedCfg = JSON.parse(lsGet(LS_CFG)); } catch(e){}
    const cfg = Object.assign({}, DEFAULTS, savedCfg||{});
    emptyTolerance = cfg.emptyTolerance || DEFAULTS.emptyTolerance;
    
    /**
     * Escapes HTML special characters to prevent XSS
     * @param {*} s - Value to escape
     * @returns {string} Escaped string
     */
    const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

    // ========================================
    // UI PANEL CREATION
    // ========================================
    
    /**
     * Main UI panel container
     * @type {HTMLDivElement}
     */
    const w = document.createElement('div');
    w.id = 'xuf';
    w.style.cssText = 'position:fixed;right:20px;bottom:20px;width:304px;background:var(--panel);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:var(--ink);border:1px solid rgba(255,255,255,.1);border-radius:16px;z-index:99999;box-shadow:0 12px 40px rgba(0,0,0,.55);overflow:hidden';
    w.innerHTML = `
      <div class="accent"></div>
      <div class="hdr" id="xuf-hdr">
        <span class="dot"></span>
        <span class="ttl">️ Safe <b>Unfollow</b></span>
        <span class="ver">v7.3</span>
        <span class="status-indicator" id="xuf-status-indicator">●</span>
        <button class="chev" id="xuf-col" title="Collapse / expand"></button>
      </div>
      <div class="body">
        <div class="grid">
          <div><label class="lab">Max Unfollows</label><input type="number" id="cfg-limit" value="${cfg.limit}" min="1" max="1000"></div>
          <div><label class="lab">Min Delay (s)</label><input type="number" id="cfg-min" value="${cfg.minDelay}" min="3" max="60"></div>
          <div><label class="lab">Max Delay (s)</label><input type="number" id="cfg-max" value="${cfg.maxDelay}" min="5" max="120"></div>
          <div><label class="lab">Sort Order</label><div class="tog"><span>Oldest First</span><input type="checkbox" id="cfg-oldest" ${cfg.oldestFirst?'checked':''}></div></div>
          <div class="grid-full"><label class="lab">Empty Page Tolerance <span class="hint">(pages with no valid targets before stopping)</span></label>
            <input type="number" id="cfg-tolerance" value="${cfg.emptyTolerance || 50}" min="1" max="999">
          </div>
        </div>
        <div class="prog">
          <div class="prow"><span class="st" id="xuf-st">Ready</span><span class="cnt" id="xuf-cnt">0 / ${cfg.limit}</span></div>
          <div class="track"><div class="fill" id="xuf-fill"></div><div class="sheen"></div></div>
        </div>
        <button class="btn" id="xuf-btn">▶ Start (Oldest First)</button>
        <div class="log" id="xuf-log"></div>
      </div>`;
    document.body.appendChild(w);

    try { const p = JSON.parse(lsGet(LS_POS)); if (p && typeof p.left==='number') { w.style.left=p.left+'px'; w.style.top=p.top+'px'; w.style.right='auto'; w.style.bottom='auto'; } } catch(e){}
    if (lsGet(LS_COL)==='1') w.classList.add('collapsed');

    // ========================================
    // DOM HELPERS & CONSTANTS
    // ========================================
    
    /**
     * Shorthand for getElementById
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    const $ = id => document.getElementById(id);
    
    const logEl = $('xuf-log');
    
    /**
     * Log message color mappings by type
     * @type {Object.<string, string>}
     */
    const COL = { success:'var(--ok)', error:'var(--err)', warn:'var(--warn)', system:'var(--b)', info:'var(--ink)', debug:'var(--mut)' };
    
    /**
     * Log message icon mappings by type
     * @type {Object.<string, string>}
     */
    const ICO = { success:'✅', error:'❌', warn:'⚠️', system:'🔄', info:'ℹ️', debug:'🔍' };
    
    // ========================================
    // LOGGING FUNCTION
    // ========================================
    
    /**
     * Adds a formatted entry to the visual log and console
     * Automatically removes oldest entries when exceeding 240 items
     * 
     * @param {string} msg - Message to log
     * @param {'success'|'error'|'warn'|'system'|'info'|'debug'} [type='info'] - Log entry type
     */
    function log(msg, type='info') {
        const e = document.createElement('div');
        e.className = 'le'; e.style.color = COL[type] || 'var(--ink)';
        e.innerHTML = `<span style="margin-right:5px">${ICO[type]||'ℹ️'}</span>${esc(msg)}`;
        logEl.appendChild(e); logEl.scrollTop = logEl.scrollHeight;
        while (logEl.children.length > 240) logEl.removeChild(logEl.firstChild);
        console.log(`[XUnfollow][${type}] ${msg}`);
    }
    
    // ========================================
    // DELAY/SLEEP UTILITY
    // ========================================
    
    /**
     * Promise-based delay with optional randomization
     * @param {number} a - If both params provided: min delay in ms. Single param: fixed delay
     * @param {number} [b] - Max delay in ms (for randomization)
     * @returns {Promise<void>}
     */
    const sleep = (a,b) => new Promise(r => setTimeout(r, typeof a === 'number' && typeof b === 'number' ? 
        Math.floor(Math.random()*(b-a+1))+a : a));
    
    // ========================================
    // STATUS & PROGRESS FUNCTIONS
    // ========================================
    
    /**
     * Updates the status display text and running indicator
     * @param {string} t - Status message to display
     */
    const setStatus = t => { 
        $('xuf-st').textContent = t; 
        const indicator = $('xuf-status-indicator');
        if (isRunning) {
            indicator.textContent = '●';
            indicator.style.color = 'var(--ok)';
        } else {
            indicator.textContent = '○';
            indicator.style.color = 'var(--mut)';
        }
    };
    
    /**
     * Updates progress bar and counter with current statistics
     * Includes ETA estimation and empty page count
     */
    const setProgress = () => { 
        const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        const remaining = unfollowCount > 0 ? Math.round((currentLimit - unfollowCount) / unfollowCount * elapsed) : 0;
        const timeStr = remaining > 0 ? ` ~${remaining}s left` : '';
        const emptyStr = consecutiveEmptyPages > 0 ? ` 📄${consecutiveEmptyPages}/${emptyTolerance}` : '';
        $('xuf-cnt').textContent = `${unfollowCount} / ${currentLimit}${timeStr}${emptyStr}`; 
        $('xuf-fill').style.width = Math.min(unfollowCount/currentLimit*100,100)+'%'; 
    };
    
    /**
     * Normalizes username by removing @ prefix and lowercasing
     * @param {string} s - Username to normalize
     * @returns {string} Normalized username
     */
    const norm = s => (s||'').replace(/^@/,'').toLowerCase();

    $('xuf-col').addEventListener('click', e => { 
        e.stopPropagation(); 
        w.classList.toggle('collapsed'); 
        $('xuf-col').textContent = w.classList.contains('collapsed') ? '▸' : '▾'; 
        lsSet(LS_COL, w.classList.contains('collapsed')?'1':'0'); 
    });
    
    (function drag(){
        const hdr = $('xuf-hdr'); let sx, sy, ox, oy, dragging=false;
        hdr.addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return;
            const r = w.getBoundingClientRect();
            if (w.style.right!=='auto') { w.style.left=r.left+'px'; w.style.top=r.top+'px'; w.style.right='auto'; w.style.bottom='auto'; }
            sx=e.clientX; sy=e.clientY; ox=parseFloat(w.style.left); oy=parseFloat(w.style.top); dragging=true; hdr.setPointerCapture(e.pointerId);
        });
        hdr.addEventListener('pointermove', e => { if (!dragging) return; w.style.left=Math.max(0,Math.min(window.innerWidth-120,ox+e.clientX-sx))+'px'; w.style.top=Math.max(0,Math.min(window.innerHeight-44,oy+e.clientY-sy))+'px'; });
        hdr.addEventListener('pointerup', () => { if(dragging){ dragging=false; lsSet(LS_POS, JSON.stringify({left:parseFloat(w.style.left),top:parseFloat(w.style.top)})); } });
    })();

    // ========================================
    // MODAL DETECTION & HANDLING
    // ========================================
    
    /**
     * Checks if an element is visible on the page
     * @param {Element} el - Element to check
     * @returns {boolean} True if element is visible and interactive
     */
    function isVisible(el){ 
        if(!el) return false; 
        const r=el.getBoundingClientRect(); 
        if(r.width<10||r.height<10) return false; 
        const cs=getComputedStyle(el); 
        return cs.visibility!=='hidden'&&cs.display!=='none'&&parseFloat(cs.opacity||'1')>0.1; 
    }
    
    /**
     * Finds a visible confirmation dialog/modal on the page
     * Uses multiple selectors to handle X.com UI variations
     * @returns {Element|null} Dialog element or null if none found
     */
    function getVisibleDialog(){
        const sels=['[role="dialog"]','[data-testid="sheetDialog"]','[data-testid="DialogContainer"]','[data-testid="confirmationSheetDialog"]','[data-testid="Dialog"]','[aria-modal="true"]'];
        const seen=new Set();
        for(const s of sels) {
            const elements = document.querySelectorAll(s);
            for(const el of elements) {
                if(seen.has(el)) continue;
                seen.add(el);
                if(isVisible(el) && el.textContent.trim().length > 5 && el.querySelector('button')) {
                    return el;
                }
            }
        }
        return null;
    }
    
    /**
     * Polls for a modal dialog to appear within a time window
     * @param {number} ms - Maximum time to wait in milliseconds
     * @returns {Promise<Element|null>} Dialog element or null if timeout
     */
    async function pollModal(ms){ 
        const t0=Date.now(); 
        while(Date.now()-t0<ms){ 
            const m=getVisibleDialog(); 
            if(m) return m; 
            await sleep(150); 
        } 
        return null; 
    }
    
    /**
     * Closes a modal dialog by finding cancel button or sending Escape key
     * @param {Element} m - Modal element to close
     */
    function closeModal(m){ 
        if(m){ 
            const c=[...m.querySelectorAll('button')].find(b=>/cancel|close/i.test(b.textContent.trim())); 
            if(c){c.click();return;} 
        } 
        document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',keyCode:27,which:27,bubbles:true})); 
    }

    // ========================================
    // EVENT SIMULATION
    // ========================================
    
    /**
     * Dispatches a mouse or pointer event on an element
     * @param {Element} el - Target element
     * @param {string} type - Event type (e.g., 'click', 'pointerdown')
     * @param {Object} init - Event initialization object
     */
    function fire(el, type, init){ 
        try{ 
            const event = type.indexOf('pointer') === 0 ? 
                new PointerEvent(type, init) : 
                new MouseEvent(type, init);
            el.dispatchEvent(event); 
        } catch(e){} 
    }

    // ========================================
    // HUMANIZED CLICK SIMULATION
    // ========================================
    
    /**
     * Simulates a human-like click on a button element
     * Includes hover, press, hold, and release phases with natural timing
     * 
     * @async
     * @param {Element} buttonElement - Button to click
     * @returns {Promise<{targetTag: string}>} Object containing clicked element's tag name
     * @property {string} targetTag - 'invalid', 'hidden', or actual tag name
     */
    async function realClickOnButton(buttonElement){
        if (!buttonElement || !buttonElement.getBoundingClientRect) {
            return { targetTag: 'invalid' };
        }
        
        const r = buttonElement.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) {
            return { targetTag: 'hidden' };
        }
        
        // Calculate safe click coordinates (avoiding edges)
        const padding = 6;
        const safeWidth = Math.max(0, r.width - padding * 2);
        const safeHeight = Math.max(0, r.height - padding * 2);
        const cx = Math.round(r.left + padding + Math.random() * safeWidth);
        const cy = Math.round(r.top + padding + Math.random() * safeHeight);

        const base = {bubbles:true,cancelable:true,view:window,clientX:cx,clientY:cy,screenX:cx,screenY:cy,button:0,buttons:1,pointerId:1,pointerType:'mouse',isPrimary:true};
        const targetElement = document.elementFromPoint(cx, cy) || buttonElement;

        // Hover phase
        fire(targetElement, 'pointerover', base);
        fire(targetElement, 'mouseover', base);

        // Human reaction time delay
        await sleep(150, 400);

        // Press down phase
        fire(targetElement, 'pointerdown', base);
        fire(targetElement, 'mousedown', base);
        try { targetElement.focus(); } catch(e){}

        // Hold phase (button press duration)
        await sleep(50, 150);

        // Release phase
        fire(targetElement, 'pointerup', {...base, buttons:0});
        fire(targetElement, 'mouseup', {...base, buttons:0});
        fire(targetElement, 'click', {...base, buttons:0});

        // Fallback native click
        try { buttonElement.click(); } catch(e){}

        return { targetTag: targetElement.tagName.toLowerCase() };
    }

    // ========================================
    // DOM QUERY FUNCTIONS
    // ========================================
    
    /**
     * Extracts username from a user cell element
     * Uses cached results when available to reduce DOM queries
     * 
     * @param {Element} cell - User cell DOM element
     * @returns {string|null} Username without @ symbol, or null if not found
     */
    function getUsername(cell) {
        if (!cell) return null;
        
        // Try cached result first
        if (domCache.has(cell)) {
            const cached = domCache.get(cell);
            if (cached.username) return cached.username;
        }
        
        // Method 1: Search for profile links
        const links = cell.querySelectorAll('a[role="link"]');
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href && /^\/[a-zA-Z0-9_]{1,15}$/.test(href)) {
                const username = href.slice(1);
                domCache.set(cell, { username });
                return username;
            }
        }
        
        // Method 2: Search for @username text in spans
        const spans = cell.querySelectorAll('span');
        for (const span of spans) {
            const text = span.textContent.trim();
            if (/^@[a-zA-Z0-9_]{1,15}$/.test(text)) {
                const username = text.slice(1);
                domCache.set(cell, { username });
                return username;
            }
        }
        return null;
    }

    /**
     * Finds the "Following" button within a user cell
     * Uses cached results when available to reduce DOM queries
     * 
     * @param {Element} cell - User cell DOM element
     * @returns {HTMLButtonElement|null} Following button or null if not found
     */
    function findFollowingButton(cell) {
        if (!cell) return null;
        
        // Try cached result
        if (domCache.has(cell)) {
            const cached = domCache.get(cell);
            if (cached.button) return cached.button;
        }
        
        // Search for button with exact "Following" text
        const buttons = cell.querySelectorAll('button');
        for (const btn of buttons) {
            const text = btn.textContent.trim();
            if (text === 'Following') {
                domCache.set(cell, { button: btn });
                return btn;
            }
        }
        return null;
    }

    // ========================================
    // CONFIGURATION PERSISTENCE
    // ========================================
    
    /**
     * Saves current configuration to localStorage
     * Validates and clamps values to acceptable ranges
     */
    function persistCfg(){ 
        try {
            const tolerance = parseInt($('cfg-tolerance').value) || 50;
            emptyTolerance = Math.max(1, Math.min(999, tolerance));
            
            lsSet(LS_CFG, JSON.stringify({ 
                limit:+$('cfg-limit').value, 
                minDelay:+$('cfg-min').value, 
                maxDelay:+$('cfg-max').value, 
                oldestFirst:$('cfg-oldest').checked,
                emptyTolerance: emptyTolerance
            })); 
        } catch(e) {
            log('Failed to save settings: ' + e.message, 'error');
        }
    }
    
    ['cfg-limit','cfg-min','cfg-max','cfg-tolerance'].forEach(id=>$(id).addEventListener('change',persistCfg));
    $('cfg-oldest').addEventListener('change', e=>{ 
        persistCfg(); 
        if(!isRunning) $('xuf-btn').textContent = e.target.checked?'▶ Start (Oldest First)':'▶ Start (Newest First)'; 
    });
    $('xuf-btn').textContent = cfg.oldestFirst?'▶ Start (Oldest First)':'▶ Start (Newest First)';

    $('xuf-btn').addEventListener('click', async () => {
        if (isRunning){ 
            shouldStop=true; 
            log('Stop requested - finishing current operation...', 'warn'); 
            return; 
        }
        
        const limit=parseInt($('cfg-limit').value)||50;
        let minD=parseInt($('cfg-min').value)||8, maxD=parseInt($('cfg-max').value)||15;
        if(minD>maxD)[minD,maxD]=[maxD,minD];
        const oldest=$('cfg-oldest').checked;
        emptyTolerance = Math.max(1, Math.min(999, parseInt($('cfg-tolerance').value) || 50));

        isRunning=true; 
        shouldStop=false; 
        unfollowCount=0; 
        currentLimit=limit;
        startTime = Date.now();
        processed.clear(); 
        scannedCount=0;
        consecutiveEmptyPages = 0;
        totalScrolledPages = 0;
        domCache.delete();
        
        logEl.innerHTML=''; 
        w.classList.add('run');
        $('xuf-btn').textContent='⏹ Click to STOP'; 
        $('xuf-btn').classList.add('stop');
        w.querySelectorAll('input').forEach(i=>i.disabled=true); 
        setProgress(); 
        log(`START limit=${limit} delay=${minD}-${maxD}s order=${oldest?'OLDEST':'NEWEST'} tolerance=${emptyTolerance} pages`, 'system');

        try {
            if (oldest){
                log('Deep scrolling to the oldest edge…', 'system');
                let stuckCount = 0;
                for(let i=0;i<400&&!shouldStop;i++){
                    const before = window.scrollY;
                    window.scrollTo(0, document.body.scrollHeight);
                    await sleep(1000,1400);
                    if(window.innerHeight + window.scrollY >= document.body.scrollHeight - 30){
                        await sleep(1200,1600);
                        if(window.innerHeight + window.scrollY >= document.body.scrollHeight - 30){
                            log('Oldest edge reached', 'system');
                            break;
                        }
                    }
                    if (Math.abs(window.scrollY - before) < 10) {
                        stuckCount++;
                        if (stuckCount > 3) {
                            log('Scroll stuck at oldest edge', 'warn');
                            break;
                        }
                    }
                }
            } else {
                window.scrollTo(0, 0);
                await sleep(800,1200);
            }
            await run(minD*1000, maxD*1000, oldest);
        } catch(e){ 
            log('CRITICAL: '+e.message, 'error'); 
            console.error(e); 
        }
        finally {
            isRunning=false; 
            shouldStop=false; 
            w.classList.remove('run');
            $('xuf-btn').textContent=oldest?'▶ Start (Oldest First)':'▶ Start (Newest First)'; 
            $('xuf-btn').classList.remove('stop');
            w.querySelectorAll('input').forEach(i=>i.disabled=false);
            $('xuf-fill').style.background='var(--ok)'; 
            setStatus('Finished');
            const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
            log(`FINISHED · unfollowed=${unfollowCount}, scanned=${scannedCount}, pages=${totalScrolledPages}, time=${elapsed}s`, 'success');
            setTimeout(()=>{ $('xuf-fill').style.background='var(--b)'; }, 2500);
        }
    });

    async function run(minMs, maxMs, oldest){
        let fails=0;
        let maxConsecutiveEmpty = 0;

        while (unfollowCount<currentLimit && !shouldStop){
            let cells=[...document.querySelectorAll('[data-testid="UserCell"]')];
            if (oldest) cells.reverse();

            let foundVisibleTarget = false;
            let processedThisBatch = 0;

            for (const cell of cells) {
                if (unfollowCount >= currentLimit || shouldStop) break;

                const u = getUsername(cell);
                if (!u || processed.has(u)) continue;
                
                // Check if user already follows us back
                if (cell.querySelector('[data-testid="userFollowIndicator"]') || /Follows you/.test(cell.innerText)) {
                    processed.add(u);
                    continue;
                }

                scannedCount++;
                const btn = findFollowingButton(cell);
                if (!btn) continue;

                const r = cell.getBoundingClientRect();
                const margin = 20;
                const isFullyVisible = r.top >= margin && r.bottom <= window.innerHeight - margin;

                if (!isFullyVisible) continue;

                foundVisibleTarget = true;
                processedThisBatch++;
                consecutiveEmptyPages = 0; // Reset empty page counter when we find a target
                maxConsecutiveEmpty = 0;
                
                log(`TARGET @${u} (scanned ${scannedCount})`, 'info');
                setStatus(`Unfollowing @${u}`);

                // Humanized reading pause
                await sleep(1000, 3000);

                let modal=null, lastDiag=null;
                let retryCount = 0;
                const MAX_RETRIES = 3;
                
                while (retryCount < MAX_RETRIES && !shouldStop) {
                    const liveBtn = findFollowingButton(cell);
                    if (!liveBtn) break;
                    lastDiag = await realClickOnButton(liveBtn);
                    
                    // Handle network or rendering delays
                    await sleep(500, 800);
                    modal = await pollModal(3000);
                    if (modal) break;
                    retryCount++;
                    if (retryCount < MAX_RETRIES) {
                        log(`Retry ${retryCount} for @${u}`, 'debug');
                        await sleep(800, 1200);
                    }
                }

                if (!modal){
                    log(`CLICK FAILED @${u}: target=<${lastDiag?.targetTag}>`, 'error');
                    processed.add(u);
                    if (++fails>=3){ 
                        log('3 consecutive click failures → stopping to avoid issues', 'error');
                        return; 
                    }
                    continue;
                }

                const mtext=(modal.innerText||'').replace(/\s+/g,' ').trim();
                const mm=mtext.match(/Unfollow\s+@?([\w]{1,15})/i); 
                const mu=mm?mm[1]:null;
                
                if(mu && norm(mu)!==norm(u)){ 
                    log(`Mismatch modal=@${mu} vs @${u} → cancel`, 'error'); 
                    closeModal(modal); 
                    await sleep(600,900); 
                    processed.add(u); 
                    continue; 
                }

                const confirm = modal.querySelector('[data-testid="confirmationSheetConfirm"]') || 
                    [...modal.querySelectorAll('button')].find(b=>{
                        const t=b.textContent.trim(); 
                        return t==='Unfollow'||(/^unfollow/i.test(t)&&!/following|cancel/i.test(t));
                    });
                    
                if(!confirm){ 
                    log('No confirm button in modal', 'error'); 
                    closeModal(modal); 
                    await sleep(600,900); 
                    processed.add(u); 
                    continue; 
                }

                await realClickOnButton(confirm);
                
                // Wait for modal to close with progressive backoff
                let closed=false;
                const backoffDelays = [300, 500, 800, 1200, 2000];
                for (let i = 0; i < backoffDelays.length; i++) {
                    await sleep(backoffDelays[i]);
                    if(!getVisibleDialog()) {
                        closed=true;
                        break;
                    }
                }
                
                if(!closed){ 
                    try{confirm.click();}catch(e){} 
                    await sleep(1200,1600); 
                    closed=!getVisibleDialog(); 
                    if(!closed) closeModal(getVisibleDialog()); 
                }

                if(closed){ 
                    unfollowCount++; 
                    processed.add(u); 
                    setProgress(); 
                    fails=0; 
                    log(`✅ @${u}`, 'success'); 
                } else { 
                    log('Modal lingered @'+u, 'error'); 
                    processed.add(u); 
                    fails++; 
                }
                
                // Humanized pause between operations
                await sleep(minMs, maxMs);
            }

            // SCROLLING LOGIC - Uses configurable empty page tolerance
            if (!foundVisibleTarget) {
                consecutiveEmptyPages++;
                totalScrolledPages++;
                maxConsecutiveEmpty = Math.max(maxConsecutiveEmpty, consecutiveEmptyPages);
                
                // Log periodically, not every time
                if (consecutiveEmptyPages % 5 === 0 || consecutiveEmptyPages === 1 || consecutiveEmptyPages === emptyTolerance) {
                    log(`Empty page #${consecutiveEmptyPages}/${emptyTolerance} (total ${totalScrolledPages} pages scanned)`, 'debug');
                    setStatus(`Scanning page ${totalScrolledPages}... (${consecutiveEmptyPages}/${emptyTolerance} empty)`);
                }
                
                // Give up when tolerance is reached
                if (consecutiveEmptyPages > emptyTolerance) {
                    log(`⚠️ ${emptyTolerance} empty pages reached - stopping (tolerance exceeded)`, 'warn');
                    break;
                }
                
                // Check if we've reached the end of the list
                const before = window.scrollY;
                
                // Use varied scroll distances
                const scrollFraction = SCROLL_FRACTIONS[Math.floor(Math.random() * SCROLL_FRACTIONS.length)];
                const scrollAmount = Math.floor(window.innerHeight * scrollFraction);

                if (oldest) {
                    // Check if we're at the top
                    if (window.scrollY <= 10){ 
                        log('Reached top of list', 'system'); 
                        break; 
                    }
                    window.scrollBy(0, -scrollAmount);
                    scrollDirection = 'up';
                    
                    // Occasional small scroll back (human behavior)
                    if (Math.random() < 0.08 && window.scrollY < document.body.scrollHeight - window.innerHeight) {
                        const backAmount = Math.floor(window.innerHeight * (0.08 + Math.random() * 0.12));
                        window.scrollBy(0, backAmount);
                        await sleep(400, 800);
                    }
                } else {
                    // Check if we're at the bottom
                    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 40){ 
                        log('Reached bottom of list', 'system'); 
                        break; 
                    }
                    window.scrollBy(0, scrollAmount);
                    scrollDirection = 'down';
                    
                    // Occasional scroll back up
                    if (Math.random() < 0.08 && window.scrollY > window.innerHeight) {
                        const backAmount = Math.floor(window.innerHeight * (0.08 + Math.random() * 0.12));
                        window.scrollBy(0, -backAmount);
                        await sleep(400, 800);
                    }
                }
                
                // Wait for new content to load (human-like pause)
                const pauseTime = 1500 + Math.random() * 1500;
                await sleep(pauseTime);
                
                // Check if scroll actually moved
                if (Math.abs(window.scrollY - before) < 10){ 
                    // If we're stuck, try a different approach
                    if (consecutiveEmptyPages > 5) {
                        // Try a larger jump
                        const bigJump = Math.floor(window.innerHeight * (0.7 + Math.random() * 0.3));
                        window.scrollBy(0, oldest ? -bigJump : bigJump);
                        await sleep(2000, 3000);
                        
                        // If still stuck, break
                        if (Math.abs(window.scrollY - before) < 10) {
                            log('Scroll completely stuck - likely reached end', 'system');
                            break;
                        }
                    } else {
                        // Small stuck, try again
                        log('Scroll momentarily stuck, retrying...', 'debug');
                        window.scrollBy(0, oldest ? -200 : 200);
                        await sleep(1000);
                        if (Math.abs(window.scrollY - before) < 10) {
                            // If still stuck after retry, break
                            log('Scroll stuck - reached boundary', 'system');
                            break;
                        }
                    }
                }
                
                // Update progress with empty page count
                setProgress();
            }
        }
        
        if (shouldStop) {
            log(`Stopped by user (${unfollowCount} unfollowed, scanned ${totalScrolledPages} pages)`, 'system');
        } else if (consecutiveEmptyPages > emptyTolerance) {
            log(`Stopped: ${consecutiveEmptyPages} consecutive empty pages (tolerance: ${emptyTolerance})`, 'warn');
        } else if (unfollowCount >= currentLimit) {
            log(`Target reached: ${unfollowCount} users unfollowed`, 'success');
        } else {
            log(`Stopped: end of list reached (${totalScrolledPages} pages scanned)`, 'system');
        }
    }
})();
