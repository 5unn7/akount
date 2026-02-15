// ═══════════════════════════════════════════════════════
// AKOUNT — Command Palette
// ═══════════════════════════════════════════════════════

let cmdOpen = false;
let CF = [];
let cSel = 0;
let cmdCat = 'all';

const CD = [
    { i: '&#128196;', t: 'Invoice #1047 — ABC Corp', d: '$4,200 USD · Overdue', cat: 'search', a: () => openDetail('inv-1047') },
    { i: '&#128196;', t: 'Invoice #1046 — XYZ Ltd', d: '$8,200 CAD · Paid', cat: 'search', a: () => openDetail('inv-1046') },
    { i: '&#128196;', t: 'Invoice #1045 — TechStart GmbH', d: '€6,500 EUR · Sent', cat: 'search', a: () => { } },
    { i: '&#128176;', t: 'RBC Business Chequing', d: '$29,340 CAD', cat: 'search', a: () => navigateTo('banking') },
    { i: '&#128176;', t: 'Wise USD Balance', d: '$13,160 USD', cat: 'search', a: () => navigateTo('banking') },
    { i: '&#128100;', t: 'ABC Corp', d: 'Client · 12 invoices · $48,600 total', cat: 'search', a: () => { } },
    { i: '&#128100;', t: 'XYZ Ltd', d: 'Client · 8 invoices · $32,400 total', cat: 'search', a: () => { } },
    { i: '&#128100;', t: 'TechStart GmbH', d: 'Client · 3 invoices · €19,500 total', cat: 'search', a: () => { } },
    { i: '&#10022;', t: 'New Invoice', d: 'Create a new invoice', k: 'n', cat: 'action', a: () => showToast('New invoice form opened') },
    { i: '&#10022;', t: 'New Transaction', d: 'Add manual transaction', cat: 'action', a: () => showToast('Transaction form opened') },
    { i: '&#128260;', t: 'Sync All Accounts', d: 'Refresh bank feeds', cat: 'action', a: () => showToast('Syncing all accounts...') },
    { i: '&#128179;', t: 'Export Report', d: 'Download PDF/CSV report', cat: 'action', a: () => showToast('Export dialog opened') },
    { i: '&#127969;', t: 'Overview', d: 'Dashboard & financial pulse', cat: 'nav', a: () => navigateTo('overview') },
    { i: '&#128260;', t: 'Banking', d: 'Accounts & transactions', cat: 'nav', a: () => navigateTo('banking') },
    { i: '&#128188;', t: 'Business', d: 'Clients, invoices, vendors & bills', cat: 'nav', a: () => navigateTo('business') },
    { i: '&#128210;', t: 'Accounting', d: 'Journal entries & chart of accounts', cat: 'nav', a: () => navigateTo('accounting') },
    { i: '&#128200;', t: 'Planning', d: 'Reports, budgets & forecasts', cat: 'nav', a: () => navigateTo('planning') },
    { i: '&#129302;', t: 'AI Advisor', d: 'Insights & recommendations', cat: 'nav', a: () => navigateTo('ai') },
    { i: '&#129309;', t: 'Services', d: 'Accountant & bookkeeping help', cat: 'nav', a: () => navigateTo('services') },
    { i: '&#9881;', t: 'System', d: 'Entities, integrations & settings', cat: 'nav', a: () => navigateTo('system') },
];

const aiResponses = {
    'revenue': 'Your <strong>Q1 revenue is $24,800</strong>, up 23% from last year. Consulting services drive 78% of income. Top client: XYZ Ltd ($32,400 lifetime).',
    'cash': 'Current cash position: <strong>$47,200 across 3 accounts</strong>. CAD: $29,300 | USD: $13,200 | EUR: $4,700. Runway: 5.6 months at current burn rate.',
    'overdue': '<strong>1 invoice overdue</strong>: #1047 to ABC Corp for $4,200 USD (3 days late). Their payment history suggests a reminder will resolve in ~48 hours.',
    'profit': 'February profit: <strong>$16,380</strong> (66% margin). Up 18% from January. Largest expense: WeWork rent ($1,800/mo). SaaS tools: $340/mo (consolidation opportunity).',
    'default': 'I can help with questions about your <strong>revenue</strong>, <strong>cash position</strong>, <strong>overdue invoices</strong>, <strong>profit margins</strong>, <strong>runway</strong>, or any financial metric. What would you like to know?'
};

function filterCmdCat(cat, el) {
    cmdCat = cat;
    document.querySelectorAll('.cmd-cat').forEach(c => c.classList.toggle('on', c.dataset.cat === cat));
    const q = document.getElementById('cIn').value.toLowerCase();
    filterCmdItems(q);
}

function filterCmdItems(q) {
    document.getElementById('cmdAiResp').classList.remove('vis');
    if (cmdCat === 'ai') {
        CF = []; cSel = 0; renderCmd();
        if (q.length > 2) {
            let resp = aiResponses.default;
            for (const [k, v] of Object.entries(aiResponses)) {
                if (k !== 'default' && q.includes(k)) { resp = v; break; }
            }
            document.getElementById('cmdAiResp').innerHTML = resp;
            document.getElementById('cmdAiResp').classList.add('vis');
        }
        return;
    }
    CF = CD.filter(c => {
        if (cmdCat !== 'all' && c.cat !== cmdCat) return false;
        if (q) return (c.t + c.d).toLowerCase().includes(q);
        return true;
    });
    cSel = 0; renderCmd();
}

function openCmd() {
    document.getElementById('cOv').classList.add('vis');
    document.getElementById('cIn').value = '';
    cmdCat = 'all';
    document.querySelectorAll('.cmd-cat').forEach(c => c.classList.toggle('on', c.dataset.cat === 'all'));
    document.getElementById('cmdAiResp').classList.remove('vis');
    CF = [...CD]; cSel = 0; renderCmd();
    setTimeout(() => document.getElementById('cIn').focus(), 40);
    cmdOpen = true;
}

function closeCmd() {
    document.getElementById('cOv').classList.remove('vis');
    cmdOpen = false;
}

function renderCmd() {
    const el = document.getElementById('cRes');
    el.innerHTML = CF.map((c, i) =>
        `<div class="cmd-item${i === cSel ? ' sel' : ''}" data-i="${i}"><div class="cmd-ii">${c.i}</div><div class="cmd-it"><div class="cmd-itn">${c.t}</div><div class="cmd-itd">${c.d}</div></div>${c.k ? `<span class="cmd-ik">${c.k}</span>` : ''}</div>`
    ).join('');
    el.querySelectorAll('.cmd-item').forEach(ci =>
        ci.addEventListener('click', () => { CF[+ci.dataset.i]?.a(); closeCmd(); })
    );
}

function initCommandPalette() {
    document.getElementById('cIn').addEventListener('input', e => {
        filterCmdItems(e.target.value.toLowerCase());
    });
    document.getElementById('cOv').addEventListener('click', e => {
        if (e.target === document.getElementById('cOv')) closeCmd();
    });
}
