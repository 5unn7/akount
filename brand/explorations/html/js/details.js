// ═══════════════════════════════════════════════════════
// AKOUNT — Detail Panel Templates & Logic
// ═══════════════════════════════════════════════════════

let detOpen = false;

const DT = {
    'inv-1047': `<span class="d-badge overdue">3 days overdue</span><h2 class="d-title">Invoice #1047</h2><p class="d-sub">ABC Corp — Consulting Services</p><div class="d-amount">$4,200.00 <span class="cur">USD</span></div><div class="d-row"><span class="d-row-l">Issue Date</span><span class="d-row-v">Jan 28, 2026</span></div><div class="d-row"><span class="d-row-l">Due Date</span><span class="d-row-v" style="color:var(--red)">Feb 6, 2026</span></div><div class="d-row"><span class="d-row-l">Client</span><span class="d-row-v">sarah@abccorp.com</span></div><div class="d-row"><span class="d-row-l">FX Rate</span><span class="d-row-v">1.3520 USD→CAD</span></div><div class="d-row"><span class="d-row-l">CAD Amount</span><span class="d-row-v">$5,678.40</span></div><div class="d-row"><span class="d-row-l">Entity</span><span class="d-row-v">Marakana Corp</span></div><div class="d-row"><span class="d-row-l">GL Account</span><span class="d-row-v">1200 — Accounts Receivable</span></div><div class="d-actions"><button class="btn pri" onclick="showToast('Reminder sent')">&#9993; Send Reminder</button><button class="btn" onclick="showToast('Marked as paid');closeDetail()">&#10003; Mark as Paid</button><button class="btn">&#128196; View PDF</button><button class="btn">&#128337; Payment History</button><button class="btn">&#9998; Edit Invoice</button></div>`,

    'inv-1046': `<span class="d-badge paid">Paid</span><h2 class="d-title">Invoice #1046</h2><p class="d-sub">XYZ Ltd — Monthly Retainer</p><div class="d-amount">$8,200.00 <span class="cur">CAD</span></div><div class="d-row"><span class="d-row-l">Issue Date</span><span class="d-row-v">Jan 22, 2026</span></div><div class="d-row"><span class="d-row-l">Paid Date</span><span class="d-row-v" style="color:var(--green)">Feb 6, 2026</span></div><div class="d-row"><span class="d-row-l">Payment</span><span class="d-row-v">Wire Transfer</span></div><div class="d-row"><span class="d-row-l">Days to Pay</span><span class="d-row-v">15 days</span></div><div class="d-row"><span class="d-row-l">Entity</span><span class="d-row-v">Marakana Corp</span></div><div class="d-row"><span class="d-row-l">Journal Entry</span><span class="d-row-v" style="color:var(--pri)">#JE-2026-0042</span></div><div class="d-actions"><button class="btn">&#128196; View PDF</button><button class="btn">&#128337; Payment History</button><button class="btn">&#128260; Create Recurring</button></div>`,

    'acct-rbc': `<h2 class="d-title">RBC Business Chequing</h2><p class="d-sub">****4521 &middot; Royal Bank of Canada</p><div class="d-amount">$29,340.00 <span class="cur">CAD</span></div><div class="d-row"><span class="d-row-l">Available</span><span class="d-row-v">$29,340.00</span></div><div class="d-row"><span class="d-row-l">Pending</span><span class="d-row-v">$0.00</span></div><div class="d-row"><span class="d-row-l">Last Sync</span><span class="d-row-v">2 min ago</span></div><div class="d-row"><span class="d-row-l">Txns (Feb)</span><span class="d-row-v">34</span></div><div class="d-row"><span class="d-row-l">Unmatched</span><span class="d-row-v" style="color:var(--pri)">8</span></div><div class="d-row"><span class="d-row-l">Entity</span><span class="d-row-v">Marakana Corp</span></div><div class="d-row"><span class="d-row-l">GL Account</span><span class="d-row-v">1000 — Cash</span></div><div class="d-actions"><button class="btn pri">&#128260; Sync Now</button><button class="btn">&#128200; Statement</button><button class="btn">&#128229; Import CSV</button><button class="btn">&#9881; Settings</button></div>`,

    'acct-wise': `<h2 class="d-title">Wise USD Balance</h2><p class="d-sub">Multi-currency &middot; Wise Business</p><div class="d-amount">$13,160.00 <span class="cur">USD</span></div><div class="d-row"><span class="d-row-l">CAD Equiv.</span><span class="d-row-v">$17,796.20</span></div><div class="d-row"><span class="d-row-l">FX Rate</span><span class="d-row-v">1.3524</span></div><div class="d-row"><span class="d-row-l">EUR Balance</span><span class="d-row-v">&euro;3,480.00</span></div><div class="d-row"><span class="d-row-l">Entity</span><span class="d-row-v">Marakana Corp</span></div><div class="d-actions"><button class="btn pri">&#128260; Sync Now</button><button class="btn">&#128179; Convert</button><button class="btn">&#128200; Statement</button></div>`,

    'acct-amex': `<h2 class="d-title">Amex Business Platinum</h2><p class="d-sub">****1008 &middot; American Express</p><div class="d-amount" style="color:var(--red)">-$2,840.00 <span class="cur">CAD</span></div><div class="d-row"><span class="d-row-l">Limit</span><span class="d-row-v">$25,000</span></div><div class="d-row"><span class="d-row-l">Available</span><span class="d-row-v">$22,160</span></div><div class="d-row"><span class="d-row-l">Statement</span><span class="d-row-v">Feb 15</span></div><div class="d-row"><span class="d-row-l">Payment Due</span><span class="d-row-v">Mar 5</span></div><div class="d-row"><span class="d-row-l">Entity</span><span class="d-row-v">Marakana Corp</span></div><div class="d-actions"><button class="btn pri">&#128176; Pay Balance</button><button class="btn">&#128200; Statement</button></div>`,

    'txn-cat': `<span class="d-badge uncat">Uncategorized</span><h2 class="d-title">AMZN MKTP CA*2R4K1</h2><p class="d-sub">RBC ****4521 &middot; Feb 9, 2026</p><div class="d-amount">-$84.99 <span class="cur">CAD</span></div><div class="d-row"><span class="d-row-l">Type</span><span class="d-row-v">Debit — Purchase</span></div><div class="d-row"><span class="d-row-l">AI Suggestion</span><span class="d-row-v" style="color:var(--pri)">Office Supplies (87%)</span></div><div class="d-row"><span class="d-row-l">Alt. Suggestion</span><span class="d-row-v">Computer Equipment (9%)</span></div><div class="d-row"><span class="d-row-l">Matched Invoice</span><span class="d-row-v">None</span></div><div class="d-row"><span class="d-row-l">Entity</span><span class="d-row-v">Marakana Corp</span></div><div class="d-row"><span class="d-row-l">GL Account</span><span class="d-row-v">—</span></div><div class="d-actions"><button class="btn pri" onclick="showToast('Categorized as Office Supplies')">&#10003; Accept: Office Supplies</button><button class="btn">&#128193; Choose Category</button><button class="btn">&#128260; Split Transaction</button><button class="btn">&#128065; Attach Receipt</button><button class="btn">&#128172; Add Note</button></div>`,
};

function openDetail(id) {
    const c = DT[id];
    if (c) document.getElementById('dCon').innerHTML = c;
    document.getElementById('dOv').classList.add('vis');
    document.getElementById('dPan').classList.add('vis');
    detOpen = true;
}

function closeDetail() {
    document.getElementById('dOv').classList.remove('vis');
    document.getElementById('dPan').classList.remove('vis');
    detOpen = false;
}

function initDetailPanel() {
    document.getElementById('dOv').addEventListener('click', closeDetail);
    document.getElementById('dClose').addEventListener('click', closeDetail);
}
