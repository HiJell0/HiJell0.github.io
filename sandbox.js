// Lincoln Law Dev Terminal — remove this script tag to go to production.
(function () {
  const REQUIRED_FIELDS = [
    'client', 'caseStage',
    'retainerAgreement', 'tasks', 'documents',
    'billing', 'plaidAccounts', 'messageThreads'
  ];
  const LOG_KEY      = 'll_api_log';
  const PROFILES_KEY = 'll_profiles';
  let isOpen    = false;
  let activeTab = 'input';
  let panelWidth = 380;

  // ── Profiles ─────────────────────────────────────────────

  function getProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]'); } catch { return []; }
  }

  function saveProfiles(list) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  }

  function upsertProfile(data) {
    const name = (data.client && data.client.fullName) || 'Unknown Client';
    const list  = getProfiles();
    const idx   = list.findIndex(p => p.name === name);
    const entry = { name, data, savedAt: new Date().toISOString() };
    if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    saveProfiles(list);
  }

  window.__llLoadProfile = function (idx) {
    const p = getProfiles()[idx];
    if (p) window.loadPortalData(p.data);
  };

  window.__llDeleteProfile = function (idx) {
    const list = getProfiles();
    list.splice(idx, 1);
    saveProfiles(list);
    if (isOpen && activeTab === 'clients') renderPanel();
  };

  // ── API Log ──────────────────────────────────────────────

  function getLog() {
    try { return JSON.parse(sessionStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
  }

  function saveLog(entries) {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(entries));
  }

  window.portalAPI = function (method, endpoint, body) {
    const clientId = (window.PORTAL_DATA && window.PORTAL_DATA.client && window.PORTAL_DATA.client.id) || 'unknown';
    const ep   = endpoint.replace(/\{clientId\}/g, clientId);
    const d    = new Date();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const entry = { time, method: method.toUpperCase(), endpoint: ep, body: body || {} };
    const log = getLog();
    log.unshift(entry);
    saveLog(log);
    if (isOpen && activeTab === 'log') renderLogTab();
    return Promise.resolve({ ok: true });
  };

  // ── Colors ───────────────────────────────────────────────

  function methodColor(m) {
    if (m === 'GET')    return '#4ade80';
    if (m === 'POST')   return '#fbbf24';
    if (m === 'PUT')    return '#60a5fa';
    if (m === 'DELETE') return '#f87171';
    return '#d6d3d1';
  }

  // ── Tab: API Log ─────────────────────────────────────────

  function renderLogTab() {
    const el = document.getElementById('ll-term-log-content');
    if (!el) return;
    const log = getLog();
    if (log.length === 0) {
      el.innerHTML = '<div style="color:#78716c;font-size:12px;padding:8px 0;">No API calls logged yet. Try interacting with the portal.</div>';
      return;
    }
    el.innerHTML = log.map(entry => {
      const color   = methodColor(entry.method);
      const hasBody = entry.body && Object.keys(entry.body).length > 0;
      const bodyHtml = hasBody
        ? `<pre style="color:#a8a29e;font-size:11px;margin:4px 0 0;white-space:pre-wrap;word-break:break-all;">${JSON.stringify(entry.body, null, 2)}</pre>`
        : '';
      return `<div style="border-bottom:1px solid #292524;padding:10px 0;">` +
        `<span style="color:#78716c;font-size:11px;">${entry.time}&nbsp;&nbsp;</span>` +
        `<span style="color:${color};font-weight:700;font-size:12px;">${entry.method}</span>` +
        `<span style="color:#e7e5e4;font-size:12px;"> ${entry.endpoint}</span>` +
        `${bodyHtml}</div>`;
    }).join('');
  }

  // ── Tab: Clients ─────────────────────────────────────────

  function renderClientsTab() {
    const el = document.getElementById('ll-term-clients-content');
    if (!el) return;
    const list = getProfiles();
    if (list.length === 0) {
      el.innerHTML = '<div style="color:#78716c;font-size:12px;padding:8px 0;line-height:1.6;">No saved clients yet.<br>Load a client and press <span style="color:#e7e5e4;">Save</span> to add them here.</div>';
      return;
    }
    el.innerHTML = list.map((p, idx) => {
      const date     = new Date(p.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const initials = (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const isActive = window.PORTAL_DATA && window.PORTAL_DATA.client && window.PORTAL_DATA.client.fullName === p.name;
      return `<div style="display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #292524;">` +
        `<div style="width:34px;height:34px;border-radius:50%;background:${isActive ? '#fbbf24' : '#1e3a5c'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${isActive ? '#1c1917' : '#fff'};flex-shrink:0;">${initials}</div>` +
        `<div style="flex:1;min-width:0;">` +
          `<div style="color:${isActive ? '#fbbf24' : '#e7e5e4'};font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>` +
          `<div style="color:#78716c;font-size:11px;margin-top:2px;">${p.description || (isActive ? 'Currently loaded' : 'Saved ' + date)}</div>` +
        `</div>` +
        `<div style="display:flex;gap:6px;flex-shrink:0;">` +
          `<button onclick="window.__llLoadProfile(${idx})" style="background:#1e3a5c;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:ui-monospace,monospace;">Load</button>` +
          `<button onclick="window.__llDeleteProfile(${idx})" style="background:#292524;color:#78716c;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-family:ui-monospace,monospace;">✕</button>` +
        `</div>` +
      `</div>`;
    }).join('');
  }

  // ── Tab: Input ───────────────────────────────────────────

  function renderInputTab() {
    const el = document.getElementById('ll-term-input-content');
    if (!el) return;
    el.innerHTML =
      `<textarea id="ll-ta" spellcheck="false" placeholder="Paste your PORTAL_DATA JSON here..."` +
      ` style="flex:1;width:100%;background:#0c0a09;color:#e7e5e4;border:1px solid #292524;border-radius:6px;padding:12px;font-family:ui-monospace,monospace;font-size:12px;resize:none;outline:none;box-sizing:border-box;line-height:1.5;min-height:0;"></textarea>` +
      `<div id="ll-err" style="color:#f87171;font-size:11px;margin-top:6px;min-height:16px;font-family:ui-monospace,monospace;word-break:break-word;flex-shrink:0;"></div>` +
      `<div style="display:flex;gap:8px;margin-top:8px;flex-shrink:0;">` +
        `<button id="ll-btn-load" style="flex:1;background:#1e3a5c;color:#fff;border:none;border-radius:8px;padding:9px 0;font-size:12px;font-weight:700;cursor:pointer;font-family:ui-monospace,monospace;">Load</button>` +
        `<button id="ll-btn-save" style="flex:1;background:#292524;color:#e7e5e4;border:none;border-radius:8px;padding:9px 0;font-size:12px;font-weight:600;cursor:pointer;font-family:ui-monospace,monospace;">Save</button>` +
        `<button id="ll-btn-clear" style="flex:1;background:#292524;color:#e7e5e4;border:none;border-radius:8px;padding:9px 0;font-size:12px;font-weight:600;cursor:pointer;font-family:ui-monospace,monospace;">Clear</button>` +
      `</div>`;

    const ta = document.getElementById('ll-ta');
    if (window.PORTAL_DATA) ta.value = JSON.stringify(window.PORTAL_DATA, null, 2);

    document.getElementById('ll-btn-load').onclick = function () {
      const errEl = document.getElementById('ll-err');
      errEl.textContent = '';
      let obj;
      try { obj = JSON.parse(ta.value.trim()); } catch (e) {
        errEl.textContent = 'Invalid JSON: ' + e.message; return;
      }
      const missing = REQUIRED_FIELDS.filter(f => !(f in obj));
      if (missing.length) { errEl.textContent = 'Missing: ' + missing.join(', '); return; }
      window.loadPortalData(obj);
    };

    document.getElementById('ll-btn-save').onclick = function () {
      if (!window.PORTAL_DATA) return;
      navigator.clipboard.writeText(JSON.stringify(window.PORTAL_DATA, null, 2));
      upsertProfile(window.PORTAL_DATA);
      const btn = document.getElementById('ll-btn-save');
      if (btn) { btn.textContent = 'Saved ✓'; btn.style.color = '#4ade80'; setTimeout(() => { btn.textContent = 'Save'; btn.style.color = '#e7e5e4'; }, 1400); }
    };

    document.getElementById('ll-btn-clear').onclick = function () {
      window.clearPortalData();
    };
  }

  // ── Panel ────────────────────────────────────────────────

  function tabStyle(tab) {
    const on = activeTab === tab;
    return 'flex:1;padding:9px 0;font-size:12px;font-weight:700;border:none;border-bottom:2px solid ' +
      (on ? '#fbbf24' : 'transparent') + ';cursor:pointer;font-family:ui-monospace,monospace;background:' +
      (on ? '#292524' : 'transparent') + ';color:' + (on ? '#fbbf24' : '#78716c') + ';';
  }

  function renderPanel() {
    const panel = document.getElementById('ll-term-panel');
    if (!panel) return;
    panel.style.width = panelWidth + 'px';

    const profileCount = getProfiles().length;
    const clientsBadge = profileCount > 0
      ? ` <span style="color:#78716c;font-size:10px;font-weight:400;">(${profileCount})</span>`
      : '';

    panel.innerHTML =
      // Left-edge drag handle
      `<div id="ll-drag" style="position:absolute;left:0;top:0;bottom:0;width:5px;cursor:ew-resize;z-index:10;background:transparent;"></div>` +

      // Header
      `<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px 0;flex-shrink:0;">` +
        `<span style="color:#57534e;font-size:10px;font-family:ui-monospace,monospace;font-weight:700;letter-spacing:0.08em;">⚡ DEV TERMINAL</span>` +
        `<button id="ll-close" style="background:none;border:none;color:#57534e;font-size:13px;cursor:pointer;padding:2px 4px;line-height:1;font-family:ui-monospace,monospace;">✕</button>` +
      `</div>` +

      // Tabs
      `<div style="display:flex;border-bottom:1px solid #292524;flex-shrink:0;margin-top:10px;">` +
        `<button onclick="window.__llTabSwitch('input')" style="${tabStyle('input')}">Input</button>` +
        `<button onclick="window.__llTabSwitch('clients')" style="${tabStyle('clients')}">Clients${clientsBadge}</button>` +
        `<button onclick="window.__llTabSwitch('log')" style="${tabStyle('log')}">API Log</button>` +
      `</div>` +

      // Content area
      `<div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:12px 14px;min-height:0;">` +
        (activeTab === 'input'
          ? `<div id="ll-term-input-content" style="display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;"></div>`
          : activeTab === 'clients'
          ? `<div id="ll-term-clients-content" style="flex:1;overflow-y:auto;font-family:ui-monospace,monospace;"></div>`
          : `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0;">` +
              `<span style="font-size:11px;color:#78716c;">API calls this session (newest first)</span>` +
              `<button id="ll-btn-clear-log" style="background:none;border:none;color:#78716c;font-size:11px;cursor:pointer;font-family:ui-monospace,monospace;padding:0;">Clear</button>` +
            `</div>` +
            `<div id="ll-term-log-content" style="flex:1;overflow-y:auto;font-family:ui-monospace,monospace;"></div>`
        ) +
      `</div>`;

    document.getElementById('ll-close').onclick = function () { isOpen = false; render(); };

    const drag = document.getElementById('ll-drag');
    drag.addEventListener('mousedown', startDrag);
    drag.addEventListener('touchstart', startDrag, { passive: false });

    if (activeTab === 'input') {
      renderInputTab();
    } else if (activeTab === 'clients') {
      renderClientsTab();
    } else {
      renderLogTab();
      const clb = document.getElementById('ll-btn-clear-log');
      if (clb) clb.onclick = function () { saveLog([]); renderLogTab(); };
    }
  }

  // ── Drag (left edge → resize width) ──────────────────────

  var dragStartX = 0, dragStartW = 0;

  function startDrag(e) {
    dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartW = panelWidth;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    e.preventDefault();
  }

  function onDrag(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    panelWidth = Math.max(280, Math.min(window.innerWidth * 0.65, dragStartW + (dragStartX - x)));
    const panel = document.getElementById('ll-term-panel');
    if (panel) panel.style.width = panelWidth + 'px';
    e.preventDefault();
  }

  function endDrag() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
  }

  // ── Tab switch ───────────────────────────────────────────

  window.__llTabSwitch = function (tab) { activeTab = tab; renderPanel(); };

  // ── Default Clients (seeded on first load) ────────────────

  function seedDefaultProfiles() {
    if (localStorage.getItem(PROFILES_KEY)) return;

    const ts = '2026-04-26T00:00:00.000Z';

    const clients = [

      { name: 'Robert Kim', savedAt: ts, description: 'Intake · Just retained, nothing started', data: {
        client: { id: 'c_kim_001', firstName: 'Robert', fullName: 'Robert Kim' },
        caseStage: 'Intake',
        retainerAgreement: { status: 'signed', signedDate: '2026-04-21T11:20:00.000Z' },
        tasks: [
          { id: 't1', title: 'Sign retainer agreement',              status: 'completed', type: 'review',    link: 'billing.html' },
          { id: 't2', title: 'Connect your bank accounts via Plaid', status: 'pending',   type: 'plaid',     link: 'intake.html',    urgent: true },
          { id: 't3', title: 'Upload your required documents',       status: 'pending',   type: 'document',  link: 'documents.html', dueDate: '2026-05-05T23:59:59.000Z' }
        ],
        documents: [
          { id: 'doc_photo_id',   name: 'Government-Issued Photo ID',       status: 'unsubmitted', instructionsUrl: '#' },
          { id: 'doc_pay_stubs',  name: 'Pay Stubs (Last 60 Days)',          status: 'unsubmitted', instructionsUrl: '#' },
          { id: 'doc_bank_stmts', name: 'Bank Statements (Last 6 Months)',   status: 'unsubmitted', instructionsUrl: '#' },
          { id: 'doc_tax_2024',   name: '2024 Federal Tax Return',           status: 'unsubmitted', instructionsUrl: '#' },
          { id: 'doc_tax_2023',   name: '2023 Federal Tax Return',           status: 'unsubmitted', instructionsUrl: '#' }
        ],
        billing: {
          balance: 1500, totalFees: 1500, paid: 500, remaining: 1000,
          nextPaymentDue: '2026-05-21', nextPaymentAmount: 500,
          paymentMethod: 'manual', dateChangesUsed: 0, dateChangesAllowed: 2, bounceFee: 35,
          installments: [
            { num: 1, of: 3, amount: 500, status: 'paid',      date: '2026-04-21', method: 'manual' },
            { num: 2, of: 3, amount: 500, status: 'upcoming',  date: '2026-05-21', method: 'manual' },
            { num: 3, of: 3, amount: 500, status: 'scheduled', date: '2026-06-21', method: 'manual' }
          ]
        },
        plaidAccounts: [],
        messageThreads: [
          { id: 'thread_001', subject: 'Welcome to Lincoln Law', status: 'open', messages: [
            { id: 'm1', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-04-21T11:45:00.000Z', isIntro: true },
            { id: 'm2', sender: 'staff', senderName: 'Andrew Curtis', text: 'Robert, glad to have you with us. Your retainer is signed and your first payment is confirmed. Your next step is connecting your bank accounts through Plaid — that\'s the fastest way for us to get the financial picture we need to prepare your petition. Reach out anytime you have questions.', time: '2026-04-21T11:46:00.000Z' }
          ]}
        ]
      }},

      { name: 'Sandra Okafor', savedAt: ts, description: 'Filing · Overdue payment, doc resubmission, date changes exhausted', data: {
        client: { id: 'c_okafor_002', firstName: 'Sandra', fullName: 'Sandra Okafor' },
        caseStage: 'Filing',
        retainerAgreement: { status: 'signed', signedDate: '2026-01-30T15:00:00.000Z' },
        tasks: [
          { id: 't1', title: 'Sign retainer agreement',           status: 'completed', type: 'review',   link: 'billing.html' },
          { id: 't2', title: 'Connect bank accounts via Plaid',   status: 'completed', type: 'plaid',    link: 'intake.html' },
          { id: 't3', title: 'Resubmit Chase bank statements',    status: 'pending',   type: 'document', link: 'documents.html', urgent: true, dueDate: '2026-05-01T23:59:59.000Z' },
          { id: 't4', title: 'Make overdue installment payment',  status: 'pending',   type: 'payment',  link: 'billing.html',   urgent: true },
          { id: 't5', title: 'Upload 2024 federal tax return',    status: 'pending',   type: 'document', link: 'documents.html', dueDate: '2026-05-12T23:59:59.000Z' }
        ],
        documents: [
          { id: 'doc_photo_id',   name: 'Government-Issued Photo ID',       status: 'completed' },
          { id: 'doc_pay_stubs',  name: 'Pay Stubs (Last 60 Days)',          status: 'completed' },
          { id: 'doc_bank_stmts', name: 'Bank Statements (Last 6 Months)',   status: 'needs_resubmission', instructionsUrl: '#', note: 'Pages 3\u20135 are missing from the Chase account ending in 4821. Please download the full statement PDF and resubmit.' },
          { id: 'doc_tax_2024',   name: '2024 Federal Tax Return',           status: 'unsubmitted', instructionsUrl: '#' },
          { id: 'doc_tax_2023',   name: '2023 Federal Tax Return',           status: 'completed' },
          { id: 'doc_cc_cert',    name: 'Credit Counseling Certificate',     status: 'completed' }
        ],
        billing: {
          balance: 1800, totalFees: 1800, paid: 720, remaining: 1080,
          nextPaymentDue: '2026-04-10', nextPaymentAmount: 360,
          paymentMethod: 'manual', dateChangesUsed: 2, dateChangesAllowed: 2, bounceFee: 35,
          installments: [
            { num: 1, of: 5, amount: 360, status: 'paid',      date: '2026-02-01', method: 'manual' },
            { num: 2, of: 5, amount: 360, status: 'paid',      date: '2026-03-01', method: 'manual' },
            { num: 3, of: 5, amount: 360, status: 'overdue',   date: '2026-04-10', method: 'manual' },
            { num: 4, of: 5, amount: 360, status: 'scheduled', date: '2026-05-10', method: 'manual' },
            { num: 5, of: 5, amount: 360, status: 'scheduled', date: '2026-06-10', method: 'manual' }
          ]
        },
        plaidAccounts: [
          { id: 'acct_1', institution: 'Chase',       accountName: 'Chase Total Checking \u20224821', type: 'checking', status: 'connected',    lastSync: '2026-04-25T07:30:00.000Z' },
          { id: 'acct_2', institution: 'Wells Fargo', accountName: 'Wells Fargo Savings \u20226603',  type: 'savings',  status: 'disconnected', lastSync: '2026-03-14T09:00:00.000Z' }
        ],
        messageThreads: [
          { id: 'thread_001', subject: 'Bank statements \u2014 pages missing', status: 'open', messages: [
            { id: 'm1', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-04-14T09:00:00.000Z', isIntro: true },
            { id: 'm2', sender: 'staff', senderName: 'Jessica Park', text: 'Hi Sandra \u2014 we received your Chase bank statements but pages 3 through 5 are missing from the April export. We need the complete document before we can finalize your petition. You can reupload from the Documents tab.', time: '2026-04-14T09:02:00.000Z' },
            { id: 'm3', sender: 'client', text: 'I\'m so sorry, I didn\'t realize it cut off. I\'ll log into Chase and download the full PDF today.', time: '2026-04-14T10:31:00.000Z' },
            { id: 'm4', sender: 'staff', senderName: 'Jessica Park', text: 'No problem at all \u2014 make sure you download the statement PDF directly rather than the transaction history CSV. Let us know if Chase gives you any trouble.', time: '2026-04-14T11:05:00.000Z' }
          ]},
          { id: 'thread_002', subject: 'April payment \u2014 overdue notice', status: 'open', messages: [
            { id: 'm5', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-04-16T08:00:00.000Z', isIntro: true },
            { id: 'm6', sender: 'staff', senderName: 'Jessica Park', text: 'Sandra, your April 10th installment of $360 is now past due. Please make the payment from the Billing tab when you get a chance. Note that your two free date changes have been used, so a $50 fee would apply to any further reschedules.', time: '2026-04-16T08:01:00.000Z' }
          ]}
        ]
      }},

      { name: 'James Whitfield', savedAt: ts, description: 'Protected · 341 meeting in 9 days, autopay on, fully organized', data: {
        client: { id: 'c_whitfield_003', firstName: 'James', fullName: 'James Whitfield' },
        caseStage: 'Protected',
        caseNumber: '26-BK-02204',
        filingDate: '2026-03-01T09:00:00.000Z',
        meetingDate: '2026-05-05T14:00:00.000Z',
        meetingLocation: 'Richard B. Russell Federal Building, 75 Ted Turner Dr SW, Room 912, Atlanta, GA 30303',
        retainerAgreement: { status: 'signed', signedDate: '2026-02-12T10:00:00.000Z' },
        tasks: [
          { id: 't1', title: 'Sign retainer agreement',          status: 'completed', type: 'review',   link: 'billing.html' },
          { id: 't2', title: 'Connect bank accounts via Plaid',  status: 'completed', type: 'plaid',    link: 'intake.html' },
          { id: 't3', title: 'Submit all required documents',    status: 'completed', type: 'document', link: 'documents.html' },
          { id: 't4', title: 'Attend 341 Meeting of Creditors',  status: 'pending',   type: 'review',   dueDate: '2026-05-05T14:00:00.000Z' }
        ],
        documents: [
          { id: 'doc_photo_id',   name: 'Government-Issued Photo ID',       status: 'completed' },
          { id: 'doc_ss_card',    name: 'Social Security Card',             status: 'completed' },
          { id: 'doc_pay_stubs',  name: 'Pay Stubs (Last 60 Days)',          status: 'completed' },
          { id: 'doc_bank_stmts', name: 'Bank Statements (Last 6 Months)',   status: 'completed' },
          { id: 'doc_tax_2024',   name: '2024 Federal Tax Return',           status: 'completed' },
          { id: 'doc_tax_2023',   name: '2023 Federal Tax Return',           status: 'completed' },
          { id: 'doc_cc_cert',    name: 'Credit Counseling Certificate',     status: 'completed' }
        ],
        billing: {
          balance: 1500, totalFees: 1500, paid: 750, remaining: 750,
          nextPaymentDue: '2026-05-01', nextPaymentAmount: 250,
          paymentMethod: 'automatic', dateChangesUsed: 0, dateChangesAllowed: 2, bounceFee: 35,
          installments: [
            { num: 1, of: 6, amount: 250, status: 'paid',      date: '2026-02-12', method: 'manual' },
            { num: 2, of: 6, amount: 250, status: 'paid',      date: '2026-03-12', method: 'automatic' },
            { num: 3, of: 6, amount: 250, status: 'paid',      date: '2026-04-12', method: 'automatic' },
            { num: 4, of: 6, amount: 250, status: 'upcoming',  date: '2026-05-01', method: 'automatic' },
            { num: 5, of: 6, amount: 250, status: 'scheduled', date: '2026-06-01', method: 'automatic' },
            { num: 6, of: 6, amount: 250, status: 'scheduled', date: '2026-07-01', method: 'automatic' }
          ]
        },
        plaidAccounts: [
          { id: 'acct_1', institution: 'Bank of America', accountName: 'BofA Advantage Checking \u20222209', type: 'checking', status: 'connected', lastSync: '2026-04-26T06:15:00.000Z' },
          { id: 'acct_2', institution: 'Bank of America', accountName: 'BofA Savings \u20228841',            type: 'savings',  status: 'connected', lastSync: '2026-04-26T06:15:00.000Z' }
        ],
        messageThreads: [
          { id: 'thread_001', subject: 'Case filed \u2014 automatic stay in effect', status: 'resolved', messages: [
            { id: 'm1', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-03-01T10:00:00.000Z', isIntro: true },
            { id: 'm2', sender: 'staff', senderName: 'Andrew Curtis', text: 'James, your petition was filed this morning. The automatic stay is now in effect \u2014 creditors are legally prohibited from contacting you, garnishing wages, or pursuing collections. If any creditor reaches out, forward the details to us immediately and we\'ll handle it.', time: '2026-03-01T10:01:00.000Z' },
            { id: 'm3', sender: 'client', text: 'That\'s such a relief. My employer was about to receive a garnishment notice. Thank you.', time: '2026-03-01T11:30:00.000Z' },
            { id: 'm4', sender: 'staff', senderName: 'Andrew Curtis', text: 'The stay stops that immediately. You\'re protected now. We\'ll be in touch with your 341 meeting details shortly.', time: '2026-03-01T12:00:00.000Z' },
            { id: 'm5', sender: 'staff', senderName: 'Jessica Park', text: 'Marked resolved \u2014 341 meeting scheduled separately.', time: '2026-03-01T12:01:00.000Z', isResolution: true }
          ]},
          { id: 'thread_002', subject: '341 meeting \u2014 what to bring', status: 'open', messages: [
            { id: 'm6', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-04-20T09:00:00.000Z', isIntro: true },
            { id: 'm7', sender: 'staff', senderName: 'Jessica Park', text: 'James, your 341 Meeting of Creditors is scheduled for May 5th at 2:00 PM at the Russell Federal Building in Atlanta. Please bring your original photo ID and your Social Security card \u2014 not a photocopy. Andrew will be there with you. The meeting typically takes 5\u201310 minutes.', time: '2026-04-20T09:01:00.000Z' },
            { id: 'm8', sender: 'client', text: 'Understood. Should I be worried about creditors showing up?', time: '2026-04-22T08:45:00.000Z' },
            { id: 'm9', sender: 'staff', senderName: 'Jessica Park', text: 'It\'s rare, but creditors do have the right to attend. In straightforward Chapter 7 cases like yours, they almost never do. The trustee will ask you a standard set of questions under oath \u2014 Andrew will walk you through what to expect before we go in.', time: '2026-04-22T10:10:00.000Z' }
          ]}
        ]
      }},

      { name: 'Teresa Nguyen', savedAt: ts, data: {
        client: { id: 'c_nguyen_004', firstName: 'Teresa', fullName: 'Teresa Nguyen' },
        caseStage: 'Discharge',
        caseNumber: '26-BK-00318',
        filingDate: '2026-01-10T09:00:00.000Z',
        meetingDate: '2026-03-04T10:00:00.000Z',
        meetingLocation: 'US Bankruptcy Court, 280 S. First St, Room 3035, San Jose, CA 95113',
        retainerAgreement: { status: 'signed', signedDate: '2025-12-22T14:00:00.000Z' },
        tasks: [
          { id: 't1', title: 'Sign retainer agreement',          status: 'completed', type: 'review',   link: 'billing.html' },
          { id: 't2', title: 'Connect bank accounts via Plaid',  status: 'completed', type: 'plaid',    link: 'intake.html' },
          { id: 't3', title: 'Submit all required documents',    status: 'completed', type: 'document', link: 'documents.html' },
          { id: 't4', title: 'Attend 341 Meeting of Creditors',  status: 'completed', type: 'review' },
          { id: 't5', title: 'Make final installment payment',   status: 'pending',   type: 'payment',  link: 'billing.html', dueDate: '2026-05-10T23:59:59.000Z' }
        ],
        documents: [
          { id: 'doc_photo_id',   name: 'Government-Issued Photo ID',       status: 'completed' },
          { id: 'doc_ss_card',    name: 'Social Security Card',             status: 'completed' },
          { id: 'doc_pay_stubs',  name: 'Pay Stubs (Last 60 Days)',          status: 'completed' },
          { id: 'doc_bank_stmts', name: 'Bank Statements (Last 6 Months)',   status: 'completed' },
          { id: 'doc_tax_2024',   name: '2024 Federal Tax Return',           status: 'completed' },
          { id: 'doc_tax_2023',   name: '2023 Federal Tax Return',           status: 'completed' },
          { id: 'doc_cc_cert',    name: 'Credit Counseling Certificate',     status: 'completed' }
        ],
        billing: {
          balance: 1200, totalFees: 1200, paid: 900, remaining: 300,
          nextPaymentDue: '2026-05-10', nextPaymentAmount: 300,
          paymentMethod: 'automatic', dateChangesUsed: 1, dateChangesAllowed: 2, bounceFee: 35,
          installments: [
            { num: 1, of: 4, amount: 300, status: 'paid',     date: '2025-12-22', method: 'manual' },
            { num: 2, of: 4, amount: 300, status: 'paid',     date: '2026-02-01', method: 'automatic' },
            { num: 3, of: 4, amount: 300, status: 'paid',     date: '2026-03-01', method: 'automatic' },
            { num: 4, of: 4, amount: 300, status: 'upcoming', date: '2026-05-10', method: 'automatic' }
          ]
        },
        plaidAccounts: [
          { id: 'acct_1', institution: 'Chase', accountName: 'Chase Sapphire Checking \u20221174', type: 'checking', status: 'connected', lastSync: '2026-04-26T05:00:00.000Z' }
        ],
        messageThreads: [
          { id: 'thread_001', subject: '341 meeting \u2014 recap', status: 'resolved', messages: [
            { id: 'm1', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-03-04T12:00:00.000Z', isIntro: true },
            { id: 'm2', sender: 'staff', senderName: 'Andrew Curtis', text: 'Teresa, the 341 meeting went smoothly this morning. The trustee had no objections and asked only the standard questions. There\'s a 60-day objection period before the court issues the discharge order \u2014 we\'ll notify you the moment it comes through. No further action is needed from you.', time: '2026-03-04T12:30:00.000Z' },
            { id: 'm3', sender: 'client', text: 'I was so nervous but it really was only about 5 minutes. Thank you for being there with me.', time: '2026-03-04T13:15:00.000Z' },
            { id: 'm4', sender: 'staff', senderName: 'Andrew Curtis', text: 'That\'s completely normal \u2014 everyone is nervous going in. You did great. Now we wait for the order.', time: '2026-03-04T13:45:00.000Z' },
            { id: 'm5', sender: 'staff', senderName: 'Jessica Park', text: '341 meeting complete. Discharge period underway.', time: '2026-03-04T13:46:00.000Z', isResolution: true }
          ]},
          { id: 'thread_002', subject: 'How long does discharge take?', status: 'resolved', messages: [
            { id: 'm6', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-03-18T10:00:00.000Z', isIntro: true },
            { id: 'm7', sender: 'client', text: 'It\'s been two weeks since the meeting. Is there anything I should be doing while I wait?', time: '2026-03-18T10:01:00.000Z' },
            { id: 'm8', sender: 'staff', senderName: 'Jessica Park', text: 'Nothing at all on your end, Teresa. The 60-day window runs until May 3rd. As long as no creditors file an objection \u2014 which we don\'t anticipate \u2014 the court issues the discharge order automatically. We\'re monitoring everything. We\'ll reach out the moment it\'s granted.', time: '2026-03-18T11:20:00.000Z' },
            { id: 'm9', sender: 'client', text: 'Perfect, thank you for the reassurance.', time: '2026-03-18T11:45:00.000Z' },
            { id: 'm10', sender: 'staff', senderName: 'Jessica Park', text: 'Question answered \u2014 no action needed.', time: '2026-03-18T11:46:00.000Z', isResolution: true }
          ]}
        ]
      }},

      { name: 'Marcus Davis', savedAt: ts, data: {
        client: { id: 'c_davis_005', firstName: 'Marcus', fullName: 'Marcus Davis' },
        caseStage: 'Fresh Start',
        caseNumber: '25-BK-08834',
        filingDate: '2025-09-15T09:00:00.000Z',
        meetingDate: '2025-11-10T09:00:00.000Z',
        meetingLocation: 'Earle Cabell Federal Building, 1100 Commerce St, Room 976, Dallas, TX 75242',
        dischargeDate: '2026-01-22T00:00:00.000Z',
        retainerAgreement: { status: 'signed', signedDate: '2025-08-30T13:00:00.000Z' },
        tasks: [
          { id: 't1', title: 'Sign retainer agreement',           status: 'completed', type: 'review',   link: 'billing.html' },
          { id: 't2', title: 'Connect bank accounts via Plaid',   status: 'completed', type: 'plaid',    link: 'intake.html' },
          { id: 't3', title: 'Submit all required documents',     status: 'completed', type: 'document', link: 'documents.html' },
          { id: 't4', title: 'Attend 341 Meeting of Creditors',   status: 'completed', type: 'review' },
          { id: 't5', title: 'Complete debtor education course',  status: 'completed', type: 'form' }
        ],
        documents: [
          { id: 'doc_photo_id',   name: 'Government-Issued Photo ID',       status: 'completed' },
          { id: 'doc_ss_card',    name: 'Social Security Card',             status: 'completed' },
          { id: 'doc_pay_stubs',  name: 'Pay Stubs (Last 60 Days)',          status: 'completed' },
          { id: 'doc_bank_stmts', name: 'Bank Statements (Last 6 Months)',   status: 'completed' },
          { id: 'doc_tax_2024',   name: '2024 Federal Tax Return',           status: 'completed' },
          { id: 'doc_tax_2023',   name: '2023 Federal Tax Return',           status: 'completed' },
          { id: 'doc_cc_cert',    name: 'Credit Counseling Certificate',     status: 'completed' },
          { id: 'doc_debtor_ed',  name: 'Debtor Education Certificate',      status: 'completed' }
        ],
        billing: {
          balance: 1500, totalFees: 1500, paid: 1500, remaining: 0,
          nextPaymentDue: '2026-01-01', nextPaymentAmount: 0,
          paymentMethod: 'automatic', dateChangesUsed: 0, dateChangesAllowed: 2, bounceFee: 35,
          installments: [
            { num: 1, of: 5, amount: 300, status: 'paid', date: '2025-08-30', method: 'manual' },
            { num: 2, of: 5, amount: 300, status: 'paid', date: '2025-10-01', method: 'automatic' },
            { num: 3, of: 5, amount: 300, status: 'paid', date: '2025-11-01', method: 'automatic' },
            { num: 4, of: 5, amount: 300, status: 'paid', date: '2025-12-01', method: 'automatic' },
            { num: 5, of: 5, amount: 300, status: 'paid', date: '2026-01-01', method: 'automatic' }
          ]
        },
        plaidAccounts: [
          { id: 'acct_1', institution: 'Frost Bank', accountName: 'Frost Checking \u20223302', type: 'checking', status: 'connected', lastSync: '2026-04-26T06:00:00.000Z' }
        ],
        messageThreads: [
          { id: 'thread_001', subject: 'Your discharge has been granted', status: 'resolved', messages: [
            { id: 'm1', sender: 'staff', senderName: 'Andrew Curtis', text: 'Hi, I\'m Andrew Curtis, your attorney throughout this entire process. I have a great team of paralegals helping me stay on top of your questions.', time: '2026-01-22T09:00:00.000Z', isIntro: true },
            { id: 'm2', sender: 'staff', senderName: 'Andrew Curtis', text: 'Marcus, it\'s official \u2014 the court issued your discharge order this morning. Your eligible debts have been legally eliminated. Keep this order in a safe place; you may need it if a creditor ever contacts you again, which they are no longer permitted to do. It\'s been a pleasure representing you.', time: '2026-01-22T09:15:00.000Z' },
            { id: 'm3', sender: 'client', text: 'I\'ve been waiting for this for a long time. I can\'t thank you and your team enough. I feel like I can finally breathe again.', time: '2026-01-22T10:02:00.000Z' },
            { id: 'm4', sender: 'staff', senderName: 'Andrew Curtis', text: 'That\'s exactly what this process is designed to do. Take care of yourself, Marcus \u2014 you earned this.', time: '2026-01-22T10:30:00.000Z' },
            { id: 'm5', sender: 'staff', senderName: 'Jessica Park', text: 'Discharge granted. Case closed.', time: '2026-01-22T10:31:00.000Z', isResolution: true }
          ]}
        ]
      }}

    ];

    saveProfiles(clients);
  }

  // ── Render ───────────────────────────────────────────────

  function render() {
    const btn   = document.getElementById('ll-term-btn');
    const panel = document.getElementById('ll-term-panel');
    if (!btn || !panel) return;
    btn.style.display = isOpen ? 'none' : 'block';
    if (isOpen) { panel.style.display = 'flex'; renderPanel(); }
    else        { panel.style.display = 'none'; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    seedDefaultProfiles();
    panelWidth = Math.max(320, Math.min(420, Math.round(window.innerWidth * 0.32)));

    const btn = document.createElement('button');
    btn.id = 'll-term-btn';
    btn.textContent = '⚡ Terminal';
    btn.style.cssText = 'position:fixed;bottom:72px;right:14px;z-index:9999;background:#f59e0b;color:#1c1917;border:none;border-radius:20px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18);white-space:nowrap;font-family:ui-monospace,monospace;';
    btn.onclick = function () { isOpen = true; render(); };
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'll-term-panel';
    panel.style.cssText = 'position:fixed;top:0;right:0;bottom:0;z-index:9998;background:#1c1917;display:none;flex-direction:column;font-family:ui-monospace,monospace;box-shadow:-4px 0 32px rgba(0,0,0,0.6);';
    document.body.appendChild(panel);

    render();
  });
})();
