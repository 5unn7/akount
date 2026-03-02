// ═══════════════════════════════════════════════════════
// AKOUNT — Charts (River, Expense, Sparklines)
// ═══════════════════════════════════════════════════════

// ═══ EXPENSE CHART DATA ═══
const EC = [
    { n: 'Rent', c: '#F59E0B' }, { n: 'Pro Svc', c: '#A78BFA' }, { n: 'Travel', c: '#60A5FA' },
    { n: 'Marketing', c: '#F472B6' }, { n: 'Cloud', c: '#2DD4BF' }, { n: 'Insurance', c: '#34D399' },
    { n: 'SaaS', c: '#22D3EE' }, { n: 'Meals', c: '#F87171' }, { n: 'Supplies', c: '#A3E635' }, { n: 'Misc', c: '#9494A8' }
];

const ED = [
    [1800, 0, 0, 0, 20, 0, 0, 12, 0, 0], [0, 0, 0, 0, 0, 0, 0, 8, 0, 0], [0, 0, 120, 0, 0, 0, 0, 15, 0, 0],
    [0, 0, 0, 0, 20, 0, 68, 22, 0, 0], [0, 0, 0, 0, 0, 0, 0, 35, 0, 0], [0, 350, 0, 0, 0, 0, 0, 0, 85, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 280, 0, 0, 0, 18, 0, 0],
    [0, 0, 240, 0, 0, 0, 0, 28, 0, 0], [0, 0, 180, 0, 20, 0, 0, 32, 0, 0], [0, 0, 0, 0, 0, 0, 0, 25, 0, 15],
    [0, 0, 0, 0, 0, 420, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 48, 14, 0, 0], [0, 800, 0, 0, 0, 0, 0, 22, 0, 0], [0, 0, 0, 0, 20, 0, 0, 18, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 42, 0, 0], [0, 0, 0, 140, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 16, 0, 0], [0, 0, 0, 0, 20, 0, 0, 24, 0, 0],
    [0, 0, 0, 0, 0, 0, 20, 38, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 120, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 28],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const EM = [
    [1800, 1200, 580, 320, 80, 420, 136, 380, 240, 45], [1800, 1150, 540, 420, 100, 420, 136, 405, 205, 43],
    [1800, 900, 0, 280, 80, 0, 136, 350, 80, 30], [1800, 1400, 800, 180, 80, 0, 136, 390, 60, 20],
    [1800, 600, 200, 360, 80, 420, 136, 410, 100, 55], [1800, 1100, 420, 240, 80, 0, 136, 380, 40, 15],
    [1800, 800, 680, 280, 80, 0, 136, 420, 120, 35], [1800, 1300, 0, 300, 80, 420, 136, 360, 80, 25],
    [1800, 950, 350, 200, 80, 0, 136, 390, 60, 40], [1800, 1100, 200, 280, 80, 0, 136, 400, 100, 20],
    [1800, 700, 480, 320, 80, 420, 136, 350, 80, 30], [1800, 1050, 150, 240, 80, 0, 136, 370, 40, 15]
];

let expM = 'day';

function hex2rgba(h, a) {
    const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

function drawExp() {
    const leg = document.getElementById('expLeg'),
        bars = document.getElementById('expBars'),
        ax = document.getElementById('expAx'),
        tip = document.getElementById('expTip');
    if (!bars) return;

    let data, labels;
    if (expM === 'day') { data = ED; labels = Array.from({ length: 28 }, (_, i) => String(i + 1)); }
    else if (expM === 'week') {
        data = [];
        for (let w = 0; w < 4; w++) {
            const wk = new Array(10).fill(0);
            for (let d = w * 7; d < Math.min((w + 1) * 7, 28); d++) ED[d].forEach((v, i) => wk[i] += v);
            data.push(wk);
        }
        labels = ['W1', 'W2', 'W3', 'W4'];
    } else { data = EM; labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; }

    const active = new Set();
    data.forEach(r => r.forEach((v, i) => { if (v > 0) active.add(i); }));
    const total = expM === 'month' ? EM[1].reduce((s, v) => s + v, 0) : ED.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);

    const expTotal = document.getElementById('expTotal');
    const expPeriod = document.getElementById('expPeriod');
    if (expTotal) expTotal.textContent = '$' + total.toLocaleString();
    if (expPeriod) expPeriod.textContent = expM === 'month' ? '2026' : 'Feb 2026';

    if (leg) { leg.innerHTML = ''; active.forEach(ci => { leg.innerHTML += `<div class="exp-lg"><div class="exp-lg-dot" style="background:${EC[ci].c}"></div>${EC[ci].n}</div>`; }); }

    const maxCol = Math.max(...data.map(r => r.reduce((s, v) => s + v, 0)), 1);
    const H = 100;
    bars.innerHTML = '';
    const todayIdx = 8;

    data.forEach((row, di) => {
        const col = document.createElement('div');
        col.className = 'exp-col' + (expM === 'day' && di === todayIdx ? ' today' : '');
        const dt = row.reduce((s, v) => s + v, 0);
        if (dt === 0) { col.innerHTML = '<div class="exp-empty"></div>'; }
        else {
            const pills = []; row.forEach((v, ci) => { if (v > 0) pills.push({ ci, v }); });
            pills.sort((a, b) => b.v - a.v);
            pills.forEach(p => {
                const h = Math.max(3, Math.round((p.v / maxCol) * H));
                const a = Math.min(1, 0.35 + (p.v / maxCol) * 0.65);
                col.innerHTML += `<div class="exp-pill" style="height:${h}px;background:${hex2rgba(EC[p.ci].c, a)}"></div>`;
            });
        }
        col.addEventListener('mouseenter', () => {
            if (dt === 0) return;
            let html = `<div class="exp-tip-hd">${expM === 'day' ? 'Feb ' + labels[di] : labels[di]} &mdash; $${dt.toLocaleString()}</div>`;
            row.forEach((v, ci) => { if (v > 0) html += `<div class="exp-tip-r"><div class="exp-tip-d" style="background:${EC[ci].c}"></div><span class="exp-tip-n">${EC[ci].n}</span><span class="exp-tip-v">$${v.toLocaleString()}</span></div>`; });
            tip.innerHTML = html;
            const br = bars.getBoundingClientRect(), cr = col.getBoundingClientRect();
            tip.style.left = Math.max(60, Math.min(cr.left - br.left + cr.width / 2, br.width - 60)) + 'px';
            tip.classList.add('show');
        });
        col.addEventListener('mouseleave', () => tip.classList.remove('show'));
        bars.appendChild(col);
    });

    if (ax) {
        ax.innerHTML = '';
        labels.forEach((l, i) => {
            const sp = document.createElement('span'); sp.textContent = l;
            if (expM === 'day' && i === todayIdx) sp.className = 'today';
            if (expM === 'day' && i % 2 === 1 && i !== todayIdx) sp.style.opacity = '0';
            ax.appendChild(sp);
        });
    }
}

// ═══ RIVER (Cash Flow) ═══
function drawRiver() {
    const c = document.getElementById('riverC');
    if (!c || !c.offsetWidth) return;
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr);
    const w = c.offsetWidth, h = c.offsetHeight, mid = h * .5;
    const pts = [{ x: 0, t: -28, b: 28 }, { x: .08, t: -26, b: 26 }, { x: .18, t: -34, b: 34 }, { x: .28, t: -24, b: 24 }, { x: .35, t: -28, b: 28 }, { x: .42, t: -30, b: 30 }, { x: .5, t: -22, b: 22 }, { x: .58, t: -36, b: 36 }, { x: .68, t: -32, b: 32 }, { x: .78, t: -26, b: 26 }, { x: .88, t: -32, b: 32 }, { x: 1, t: -38, b: 38 }];

    function gY(n, s) {
        for (let i = 0; i < pts.length - 1; i++)
            if (n >= pts[i].x && n <= pts[i + 1].x) {
                const t2 = (n - pts[i].x) / (pts[i + 1].x - pts[i].x), sm = t2 * t2 * (3 - 2 * t2);
                return mid + (s === 't' ? pts[i].t + (pts[i + 1].t - pts[i].t) * sm : pts[i].b + (pts[i + 1].b - pts[i].b) * sm);
            }
        return mid;
    }

    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) ctx.lineTo(x, gY(x / w, 't'));
    for (let x = w; x >= 0; x -= 2) ctx.lineTo(x, gY(x / w, 'b'));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, mid - 40, 0, mid + 40);
    g.addColorStop(0, 'rgba(245,158,11,.08)'); g.addColorStop(.5, 'rgba(245,158,11,.03)'); g.addColorStop(1, 'rgba(245,158,11,.08)');
    ctx.fillStyle = g; ctx.fill();

    [['t', 'rgba(245,158,11,.22)', 1.5], ['b', 'rgba(245,158,11,.1)', 1]].forEach(([s, col, lw]) => {
        ctx.beginPath(); for (let x = 0; x <= w; x += 2) ctx.lineTo(x, gY(x / w, s));
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    });

    [{ x: .18, a: '$8,400' }, { x: .58, a: '$12,400' }, { x: .82, a: '$6,800' }].forEach(s => {
        const px = s.x * w, ry = gY(s.x, 't');
        ctx.beginPath(); ctx.moveTo(px, 8); ctx.quadraticCurveTo(px + 2, (8 + ry) / 2, px, ry);
        ctx.strokeStyle = 'rgba(52,211,153,.2)'; ctx.lineWidth = 1.5; ctx.stroke();
        const g2 = ctx.createRadialGradient(px, ry, 0, px, ry, 8);
        g2.addColorStop(0, 'rgba(52,211,153,.15)'); g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(px, ry, 8, 0, Math.PI * 2); ctx.fill();
        ctx.font = '500 8px Manrope'; ctx.fillStyle = 'rgba(52,211,153,.5)'; ctx.textAlign = 'center'; ctx.fillText(s.a, px, 6);
    });

    [{ x: .28, a: '$2,100' }, { x: .48, a: '$3,200' }, { x: .72, a: '$1,800' }].forEach(s => {
        const px = s.x * w, ry = gY(s.x, 'b');
        ctx.beginPath(); ctx.moveTo(px, ry); ctx.quadraticCurveTo(px - 2, (ry + h - 8) / 2, px, h - 8);
        ctx.strokeStyle = 'rgba(248,113,113,.16)'; ctx.lineWidth = 1.5; ctx.stroke();
        const g2 = ctx.createRadialGradient(px, ry, 0, px, ry, 8);
        g2.addColorStop(0, 'rgba(248,113,113,.12)'); g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(px, ry, 8, 0, Math.PI * 2); ctx.fill();
        ctx.font = '500 8px Manrope'; ctx.fillStyle = 'rgba(248,113,113,.4)'; ctx.textAlign = 'center'; ctx.fillText(s.a, px, h - 2);
    });
}

function initRiverTooltip() {
    const rW = document.getElementById('riverW'), rT = document.getElementById('rTip');
    if (!rW || !rT) return;
    rW.addEventListener('mousemove', e => {
        const r = rW.getBoundingClientRect(), x = e.clientX - r.left, p = x / r.width;
        const bals = [42e3, 40200, 44800, 38600, 41200, 43500, 39200, 47200, 44800, 41600, 44200, 49400];
        const i = Math.min(Math.floor(p * (bals.length - 1)), bals.length - 2), t = p * (bals.length - 1) - i;
        const v = Math.round(bals[i] + (bals[i + 1] - bals[i]) * t);
        rT.querySelector('.tt-v').textContent = '$' + v.toLocaleString();
        const d = new Date(2026, 0, 15 + Math.round(p * 60));
        rT.querySelector('.tt-l').textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        rT.style.left = Math.min(x + 10, r.width - 100) + 'px';
        rT.style.top = (e.clientY - r.top - 44) + 'px';
        rT.classList.add('show');
    });
    rW.addEventListener('mouseleave', () => rT.classList.remove('show'));
}

// Called after overview page is loaded
function initOverviewPage() {
    drawRiver();
    drawExp();
    initRiverTooltip();

    // Bind expense tab switching
    const expTabs = document.getElementById('expTabs');
    if (expTabs) {
        expTabs.querySelectorAll('.sec-tab').forEach(t =>
            t.addEventListener('click', () => {
                expTabs.querySelectorAll('.sec-tab').forEach(x => x.classList.remove('on'));
                t.classList.add('on');
                expM = t.dataset.p;
                drawExp();
            })
        );
    }

    window.addEventListener('resize', drawRiver);
}
