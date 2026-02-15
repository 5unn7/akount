// ═══════════════════════════════════════════════════════
// AKOUNT — Router (Hash-based SPA)
// ═══════════════════════════════════════════════════════

const domNames = {
  // Overview
  overview: 'Overview',
  'net-worth': 'Net Worth',
  'cash-flow': 'Cash Flow',
  // Banking
  banking: 'Banking',
  transactions: 'Transactions',
  reconciliation: 'Reconciliation',
  imports: 'Imports',
  transfers: 'Transfers',
  // Business
  business: 'Business',
  clients: 'Clients',
  vendors: 'Vendors',
  invoicing: 'Invoices',
  bills: 'Bills',
  payments: 'Payments',
  // Accounting
  accounting: 'Accounting',
  'journal-entries': 'Journal Entries',
  assets: 'Assets',
  'tax-rates': 'Tax Rates',
  'fiscal-periods': 'Fiscal Periods',
  // Planning
  planning: 'Planning',
  reports: 'Reports',
  budgets: 'Budgets',
  goals: 'Goals',
  forecasts: 'Forecasts',
  // AI Advisor
  ai: 'AI Advisor',
  'policy-alerts': 'Policy Alerts',
  'ai-history': 'AI History',
  // Services
  services: 'Services',
  collaboration: 'Bookkeeping',
  documents: 'Documents',
  // System
  system: 'System',
  integrations: 'Integrations',
  rules: 'Rules',
  users: 'Users',
  'audit-log': 'Audit Log',
  security: 'Security',
  settings: 'Settings',
  // Misc
  onboarding: 'Onboarding',
  filing: 'Filing Readiness'
};

// Map each sub-page to its parent domain group (for sidebar icon highlighting)
const domainGroup = {
  overview: 'overview', 'net-worth': 'overview', 'cash-flow': 'overview',
  banking: 'banking', transactions: 'banking', reconciliation: 'banking', imports: 'banking', transfers: 'banking',
  business: 'business', clients: 'business', vendors: 'business', invoicing: 'business', bills: 'business', payments: 'business',
  accounting: 'accounting', 'journal-entries': 'accounting', assets: 'accounting', 'tax-rates': 'accounting', 'fiscal-periods': 'accounting',
  planning: 'planning', reports: 'planning', budgets: 'planning', goals: 'planning', forecasts: 'planning',
  ai: 'ai', 'policy-alerts': 'ai', 'ai-history': 'ai',
  services: 'services', collaboration: 'services', documents: 'services',
  system: 'system', integrations: 'system', rules: 'system', users: 'system', 'audit-log': 'system', security: 'system', settings: 'system'
};

let curDom = '';
let viewMode = 'existing'; // 'existing', 'new'
const pageCache = {};

// Pages that have view mode variants
const viewVariants = {
  overview: ['new'],
  banking: ['new'],
  business: ['new'],
  accounting: ['new'],
  planning: ['new'],
  ai: ['new'],
  services: ['new'],
  system: ['new']
};

// Navigate to a domain by updating the hash
function navigateTo(domain) {
  if (domain === curDom) return;
  window.location.hash = '#/' + domain;
}

// Load a page fragment via fetch and inject into the mount point
async function loadPage(domain) {
  const app = document.getElementById('app');
  if (!app) return;

  // Exit transition on current content
  const currentView = app.querySelector('.view');
  if (currentView) {
    currentView.style.opacity = '0';
    currentView.style.transform = 'translateY(-6px)';
    await new Promise(r => setTimeout(r, 180));
  }

  // Determine the correct page file based on view mode
  let pageFile = domain;
  if (viewMode !== 'existing' && viewVariants[domain] && viewVariants[domain].includes(viewMode)) {
    pageFile = domain + '-' + viewMode;
  }
  const cacheKey = pageFile;

  // Fetch page (use cache if available)
  let html;
  if (pageCache[cacheKey]) {
    html = pageCache[cacheKey];
  } else {
    try {
      const resp = await fetch('pages/' + pageFile + '.html');
      if (!resp.ok) throw new Error('Page not found');
      html = await resp.text();
      pageCache[cacheKey] = html;
    } catch (e) {
      html = `<div class="page-hdr fi fi1"><div><div class="page-title">${domNames[domain] || domain}</div><div class="page-sub">Coming soon</div></div></div>
<section class="sec fi fi2"><div class="sec-h"><h2 class="sec-t">${domNames[domain] || domain}</h2><span class="sec-m">Under construction</span></div>
<div style="text-align:center;padding:40px 0;color:var(--t3)"><div style="font-size:40px;margin-bottom:12px">&#128679;</div>
<div style="font-size:13px">This page is being built. Check back soon.</div></div></section>`;
    }
  }

  // Inject content
  app.innerHTML = `<div class="view on">${html}</div>`;

  // Re-trigger fade-in animations
  app.querySelectorAll('.fi').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight; // force reflow
    el.style.animation = '';
  });

  // Update sidebar active state — highlight parent icon + sub-item, expand parent section
  const group = domainGroup[domain] || domain;
  document.querySelectorAll('.s-btn[data-d]').forEach(b =>
    b.classList.toggle('on', b.dataset.d === group)
  );
  document.querySelectorAll('.s-sub-btn[data-d]').forEach(b =>
    b.classList.toggle('on', b.dataset.d === domain)
  );
  // Auto-expand the correct section (accordion)
  document.querySelectorAll('.s-nav').forEach(nav => {
    const btn = nav.querySelector('.s-btn[data-d]');
    if (btn && btn.dataset.d === group) {
      nav.classList.add('open');
    } else {
      nav.classList.remove('open');
    }
  });

  // Update breadcrumb
  const bcPage = document.getElementById('bcPage');
  if (bcPage) bcPage.textContent = domNames[domain] || domain;

  const prevDom = curDom;
  curDom = domain;

  // Close any open panels
  closeDetail();
  closeCmd();

  // Run page-specific init
  if (domain === 'overview') {
    setTimeout(() => {
      updateGreeting();
      initOverviewPage();
    }, 80);
  }

  // Re-bind interactive elements on the new page
  rebindPageInteractions();
}

// Re-bind tab and filter click handlers on loaded pages
function rebindPageInteractions() {
  document.querySelectorAll('.sec-tabs').forEach(g => {
    g.querySelectorAll('.sec-tab').forEach(t =>
      t.addEventListener('click', () => {
        g.querySelectorAll('.sec-tab').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
      })
    );
  });

  document.querySelectorAll('.txn-filter').forEach(f =>
    f.addEventListener('click', () => {
      f.parentElement.querySelectorAll('.txn-filter').forEach(x => x.classList.remove('on'));
      f.classList.add('on');
    })
  );
}

// Handle hash changes
function onHashChange() {
  let hash = window.location.hash.replace('#/', '') || 'overview';
  if (!domNames[hash]) hash = 'overview';
  loadPage(hash);
}

// Initialize the router
function initRouter() {
  window.addEventListener('hashchange', onHashChange);

  // Set initial route
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
    window.location.hash = '#/overview';
  } else {
    onHashChange();
  }

  // Bind sidebar icon buttons — click toggles collapsible sub-menu (accordion)
  document.querySelectorAll('.s-btn[data-d]').forEach(b => {
    b.addEventListener('click', () => {
      const nav = b.closest('.s-nav');
      const isOpen = nav.classList.contains('open');
      // Close all
      document.querySelectorAll('.s-nav').forEach(n => n.classList.remove('open'));
      // Toggle this one
      if (!isOpen) nav.classList.add('open');
    });
  });

  // Bind collapsible sub-item buttons
  document.querySelectorAll('.s-sub-btn[data-d]').forEach(b =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateTo(b.dataset.d);
    })
  );

  // Logo click goes to overview
  const logo = document.querySelector('.s-logo');
  if (logo) logo.addEventListener('click', () => navigateTo('overview'));
}
