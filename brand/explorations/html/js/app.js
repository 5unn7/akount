// ═══════════════════════════════════════════════════════
// AKOUNT — App Init (Theme, Font, Entity, Greeting, Keyboard)
// ═══════════════════════════════════════════════════════

let isLight = false;
let selAc = 0;

// ═══ THEME ═══
function toggleTheme() {
    isLight = !isLight;
    document.documentElement.classList.toggle('light', isLight);
    document.getElementById('themeTog').classList.toggle('light-on', isLight);
    showToast(isLight ? 'Light mode' : 'Dark mode');
}

// ═══ FONT SIZE ═══
const fontSizes = [13, 15, 17];
let fontIdx = 1;
function changeFontSize(dir) {
    if (dir === 0) fontIdx = 1;
    else fontIdx = Math.max(0, Math.min(2, fontIdx + dir));
    document.documentElement.style.fontSize = fontSizes[fontIdx] + 'px';
    document.querySelectorAll('.font-btn').forEach((b, i) => b.classList.toggle('active', i === fontIdx));
    showToast('Font size: ' + ['Small', 'Normal', 'Large'][fontIdx]);
}

// ═══ ENTITY SELECTOR ═══
let currentEntity = 'All Entities';

function selectEntity(name, type, el) {
    currentEntity = name;
    document.getElementById('entityName').textContent = name;
    document.querySelector('.entity-type').textContent = type;
    document.querySelectorAll('.entity-dd-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.entity-dd-check').style.opacity = '0';
    });
    // If selecting via dropdown, el is passed. If programmatic, find it.
    if (el) {
        el.classList.add('active');
        el.querySelector('.entity-dd-check').style.opacity = '1';
    }

    document.getElementById('entitySel').classList.remove('open');
    showToast('Switched to ' + name);

    // Dispatch event for page-specific handling
    window.dispatchEvent(new CustomEvent('entity-change', { detail: { name, type } }));

    // Apply filter immediately if on overview
    if (typeof filterOverview === 'function') filterOverview(name);
}

// Global function called by router.js after overview loads
window.initOverviewPage = function () {
    updateGreeting();
    // Re-apply current filter
    if (typeof filterOverview === 'function') filterOverview(currentEntity);
};

window.filterOverview = function (entityName) {
    const cards = document.querySelectorAll('.ac-card');

    // Always ensure global hero is visible (in case it was hidden)
    const heroGlobal = document.getElementById('hero-global');
    if (heroGlobal) heroGlobal.style.display = 'flex';

    // If there was a personal hero, hide it (though we are removing it from HTML too)
    const heroPersonal = document.getElementById('hero-personal');
    if (heroPersonal) heroPersonal.style.display = 'none';

    // Filter Cards in Matrix
    if (entityName === 'All Entities') {
        // Show ALL cards (including Personal, per user request to "show personal card")
        cards.forEach(c => c.style.display = 'flex');
    } else {
        // Show specific entity
        cards.forEach(c => {
            const ent = c.getAttribute('data-entity');
            if (ent === entityName) {
                c.style.display = 'flex';
            } else {
                c.style.display = 'none';
            }
        });
    }
};

// ═══ TOAST ═══
let tT;
function showToast(m) {
    clearTimeout(tT);
    document.getElementById('tMsg').textContent = m;
    document.getElementById('toast').classList.add('vis');
    tT = setTimeout(() => document.getElementById('toast').classList.remove('vis'), 2600);
}

// ═══ KEYBOARD ═══
function initKeyboard() {
    document.addEventListener('keydown', e => {
        if (cmdOpen) {
            if (e.key === 'Escape') { closeCmd(); e.preventDefault(); }
            else if (e.key === 'ArrowDown') { cSel = Math.min(cSel + 1, CF.length - 1); renderCmd(); e.preventDefault(); }
            else if (e.key === 'ArrowUp') { cSel = Math.max(cSel - 1, 0); renderCmd(); e.preventDefault(); }
            else if (e.key === 'Enter') {
                if (cmdCat === 'ai') { const q = document.getElementById('cIn').value.toLowerCase(); filterCmdItems(q); }
                else { CF[cSel]?.a(); closeCmd(); }
                e.preventDefault();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const cats = ['all', 'search', 'action', 'nav', 'ai'];
                const ci = (cats.indexOf(cmdCat) + 1) % cats.length;
                filterCmdCat(cats[ci], null);
                document.querySelectorAll('.cmd-cat').forEach(c => c.classList.toggle('on', c.dataset.cat === cats[ci]));
            }
            return;
        }
        if (detOpen) { if (e.key === 'Escape') { closeDetail(); e.preventDefault(); } return; }
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

        const acs = document.querySelectorAll('#app .ac');
        switch (e.key) {
            case 'j': if (curDom === 'overview' && acs.length) { selAc = Math.min(selAc + 1, acs.length - 1); acs.forEach((c, i) => c.classList.toggle('sel', i === selAc)); } e.preventDefault(); break;
            case 'k': if (curDom === 'overview' && acs.length) { selAc = Math.max(selAc - 1, 0); acs.forEach((c, i) => c.classList.toggle('sel', i === selAc)); } e.preventDefault(); break;
            case 'Enter': case ' ': if (curDom === 'overview') openDetail('inv-1047'); e.preventDefault(); break;
            case '/': openCmd(); e.preventDefault(); break;
            case '1': navigateTo('overview'); e.preventDefault(); break;
            case '2': navigateTo('banking'); e.preventDefault(); break;
            case '3': navigateTo('business'); e.preventDefault(); break;
            case '4': navigateTo('accounting'); e.preventDefault(); break;
            case '5': navigateTo('planning'); e.preventDefault(); break;
            case '6': navigateTo('ai'); e.preventDefault(); break;
            case '7': navigateTo('services'); e.preventDefault(); break;
            case '8': navigateTo('system'); e.preventDefault(); break;
        }
    });
}

// ═══ INIT ═══
window.addEventListener('DOMContentLoaded', () => {
    // Greeting
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    // Greeting will be set after the overview page loads

    // Close entity on outside click
    document.addEventListener('click', e => {
        if (!document.getElementById('entitySel').contains(e.target))
            document.getElementById('entitySel').classList.remove('open');
    });

    // Init subsystems
    initDetailPanel();
    initCommandPalette();
    initKeyboard();
    initRouter();
});

// Update greeting after overview loads (called by router after overview page is injected)
function updateGreeting() {
    const el = document.getElementById('greeting');
    if (el) {
        const h = new Date().getHours();
        const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
        el.innerHTML = g + ', <strong>Sunny</strong>';
    }
}

// ═══ VIEW MODE SWITCH ═══
function switchViewMode(mode, btn) {
    if (viewMode === mode) return;
    viewMode = mode;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === mode));

    // Force reload of the current page with new view mode
    const currentPage = curDom || 'overview';
    curDom = ''; // Reset so loadPage doesn't skip
    loadPage(currentPage);

    const labels = { existing: 'Existing user view', new: 'New user view' };
    showToast(labels[mode] || mode);
}
