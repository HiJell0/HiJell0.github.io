// Lincoln Law Client Portal — Shared Layout & Utilities
const FIRM_LOGO = 'https://raw.githubusercontent.com/HiJell0/HiJell0/fb70edba22f2a5ed46c167d3665a6edb3ef1baa8/LLawLogo.jpeg';
const D = window.PORTAL_DATA;

const CLIENT_NAV = [
  { href: 'index.html', icon: 'home', label: 'Dashboard' },
  { href: 'documents.html', icon: 'file-text', label: 'Documents' },
  { href: 'intake.html', icon: 'link-2', label: 'Accounts' },
  { href: 'communication.html', icon: 'message-square', label: 'Messages' },
  { href: 'billing.html', icon: 'credit-card', label: 'Billing' },
];

// ─── Layout ───────────────────────────────────────────

function getCurrentPage() {
  const p = window.location.pathname.split('/').pop() || 'index.html';
  return p === '' ? 'index.html' : p;
}

function injectLayout() {
  if (window.PORTAL_DATA_MISSING || !window.PORTAL_DATA) {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page !== 'login.html') window.location.replace('login.html');
    return document.createElement('div');
  }
  const cur = getCurrentPage();
  const isMsgPage = cur === 'communication.html';
  const curNav = CLIENT_NAV.find(l => l.href === cur);
  const pageTitle = curNav ? curNav.label : 'Lincoln Law';

  const unreadCount = D.messageThreads
    ? D.messageThreads.filter(t => t.status === 'open').length
    : 0;

  // Inject Playfair Display once
  if (!document.getElementById('ll-playfair')) {
    const link = document.createElement('link');
    link.id = 'll-playfair';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = '.ll-serif{font-family:"Playfair Display",Georgia,serif}';
    document.head.appendChild(style);
  }

  const sideLinks = CLIENT_NAV.map(l => {
    const on = cur === l.href;
    const isMsg = l.href === 'communication.html';
    const badge = isMsg && unreadCount > 0
      ? `<span class="ml-auto text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-4">${unreadCount}</span>`
      : '';
    return `<a href="${l.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${on ? 'bg-white/10 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'}">
      <i data-lucide="${l.icon}" class="w-5 h-5 shrink-0 ${on ? 'text-white' : 'text-stone-500'}"></i>
      <span class="flex-1">${l.label}</span>${badge}</a>`;
  }).join('');

  const bottomLinks = CLIENT_NAV.map(l => {
    const on = cur === l.href;
    const isMsg = l.href === 'communication.html';
    const dot = isMsg && unreadCount > 0
      ? `<span class="absolute -top-0.5 right-2 w-4 h-4 bg-[#1e3a5c] text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">${unreadCount}</span>`
      : '';
    return `<a href="${l.href}" class="relative flex flex-col items-center p-2 rounded-lg min-w-[56px] ${on ? 'text-stone-900' : 'text-stone-400'}">
      <div class="relative">
        <i data-lucide="${l.icon}" class="w-6 h-6 mb-1"></i>
        ${dot}
      </div>
      <span class="text-[10px] font-medium">${l.label}</span></a>`;
  }).join('');

  document.getElementById('app').innerHTML = `
  <div class="h-dvh bg-[#faf9f7] text-stone-900 font-sans flex flex-col md:flex-row overflow-hidden">
    <!-- Sidebar Desktop -->
    <aside class="hidden md:flex w-64 flex-col bg-[#1c1917] h-full">
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <img src="${FIRM_LOGO}" alt="Logo" class="w-6 h-6 object-contain" referrerpolicy="no-referrer">
          </div>
          <h1 class="text-xl font-bold tracking-tight text-white ll-serif">Lincoln Law</h1>
        </div>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">${sideLinks}</nav>
      <div class="p-4 border-t border-white/10">
        <div class="relative" id="user-menu-wrapper">
          <button onclick="toggleUserMenu()" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group">
            <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              ${D.client.photoUrl ? `<img src="${D.client.photoUrl}" class="w-7 h-7 object-cover rounded-full">` : `<span class="text-[10px] font-bold text-stone-300 leading-none">${(D.client.fullName||D.client.firstName||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</span>`}
            </div>
            <span class="text-sm font-medium text-stone-200 flex-1 truncate">${D.client.fullName}</span>
            <i data-lucide="chevron-up" class="w-4 h-4 text-stone-600 group-hover:text-stone-400 transition-colors"></i>
          </button>
          <div id="user-menu" class="hidden absolute bottom-full left-0 right-0 mb-1 bg-[#2a2723] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
            <a href="#" onclick="handleLogout(event)" class="flex items-center gap-2 px-4 py-3 text-sm text-stone-300 hover:bg-white/10 transition-colors">
              <i data-lucide="log-out" class="w-4 h-4 text-stone-500"></i>Log Out
            </a>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 h-full relative">
      <!-- Mobile Header -->
      <header class="md:hidden bg-white border-b border-stone-200 px-4 py-3 flex justify-between items-center shrink-0 z-30 relative shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden shrink-0 border border-stone-100 bg-white">
            <img src="${FIRM_LOGO}" alt="Logo" class="w-5 h-5 object-contain" referrerpolicy="no-referrer">
          </div>
          <span class="text-sm font-semibold text-stone-800">${pageTitle}</span>
        </div>
        <div class="relative" id="mobile-user-menu-wrapper">
          <button onclick="toggleMobileUserMenu()" class="flex items-center gap-2 active:opacity-70 transition-opacity">
            <div class="w-7 h-7 rounded-full bg-[#1e3a5c] flex items-center justify-center overflow-hidden">
              ${D.client.photoUrl ? `<img src="${D.client.photoUrl}" class="w-7 h-7 object-cover rounded-full">` : `<span class="text-[10px] font-bold text-white leading-none">${(D.client.fullName||D.client.firstName||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</span>`}
            </div>
            <span class="text-xs font-medium text-stone-700">${D.client.firstName}</span>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-stone-400"></i>
          </button>
          <div id="mobile-user-menu" class="hidden absolute top-full right-0 mt-2 w-40 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50">
            <a href="#" onclick="handleLogout(event)" class="flex items-center gap-2 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
              <i data-lucide="log-out" class="w-4 h-4 text-stone-400"></i>Log Out
            </a>
          </div>
        </div>
      </header>

      <main class="flex-1 bg-[#faf9f7] ${isMsgPage ? 'overflow-hidden' : 'overflow-y-auto'}" id="main-scroll">
        <div class="${isMsgPage ? 'h-full' : 'max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8'}" id="page-content"></div>
      </main>
    </div>

    <!-- Bottom Nav Mobile -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex justify-around p-2 pb-safe z-20 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">${bottomLinks}</nav>
  </div>

  <!-- Bottom Sheet -->
  <div id="sheet-backdrop" class="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm hidden transition-opacity duration-200 opacity-0" onclick="hideBottomSheet()"></div>
  <div id="sheet-container" class="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 p-8 shadow-2xl max-h-[90vh] overflow-y-auto pb-safe transition-transform duration-300 ease-out translate-y-full"></div>

  <!-- Modal -->
  <div id="modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm hidden" onclick="if(event.target===this)hideModal()">
    <div id="modal-container" class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"></div>
  </div>

  <!-- Full-screen viewer -->
  <div id="viewer-overlay" class="fixed inset-0 z-[100] bg-stone-900 flex-col hidden"></div>`;

  return document.getElementById('page-content');
}

// ─── Bottom Sheet ────────────────────────────────────

function showBottomSheet(html) {
  const bd = document.getElementById('sheet-backdrop');
  const ct = document.getElementById('sheet-container');
  ct.innerHTML = html;
  bd.classList.remove('hidden');
  requestAnimationFrame(() => {
    bd.classList.add('opacity-100');
    bd.classList.remove('opacity-0');
    ct.classList.remove('translate-y-full');
  });
  lucide.createIcons({ nameAttr: 'data-lucide' });
}

function hideBottomSheet() {
  const bd = document.getElementById('sheet-backdrop');
  const ct = document.getElementById('sheet-container');
  bd.classList.remove('opacity-100');
  bd.classList.add('opacity-0');
  ct.classList.add('translate-y-full');
  setTimeout(() => { bd.classList.add('hidden'); }, 300);
}

// ─── Modal ───────────────────────────────────────────

function showModal(html) {
  const bd = document.getElementById('modal-backdrop');
  const ct = document.getElementById('modal-container');
  ct.innerHTML = html;
  bd.classList.remove('hidden');
  lucide.createIcons({ nameAttr: 'data-lucide' });
}

function hideModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
}

// ─── Full-screen Viewer ──────────────────────────────

function showViewer(html) {
  const v = document.getElementById('viewer-overlay');
  v.innerHTML = html;
  v.classList.remove('hidden');
  v.classList.add('flex');
  lucide.createIcons({ nameAttr: 'data-lucide' });
}

function hideViewer() {
  const v = document.getElementById('viewer-overlay');
  v.classList.add('hidden');
  v.classList.remove('flex');
}

// ─── Date Utilities ──────────────────────────────────

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(iso) {
  const d = new Date(iso);
  return `${MO[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtShort(iso) {
  const d = new Date(iso);
  return `${MO[d.getMonth()]} ${d.getDate()}`;
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'less than a minute ago';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `about ${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  const mo = Math.floor(d / 30);
  return `about ${mo} month${mo > 1 ? 's' : ''} ago`;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const h = d.getHours(), mi = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${MO[d.getMonth()]} ${d.getDate()}, ${h % 12 || 12}:${mi} ${ap}`;
}

// Returns "2:30 PM" for today's messages, "Mar 15" for older ones
function msgTimeShort(iso) {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) {
    const h = d.getHours(), mi = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${mi} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  return `${MO[d.getMonth()]} ${d.getDate()}`;
}

// ─── Helpers ─────────────────────────────────────────

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function money(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function icon(name, cls) { return `<i data-lucide="${name}" class="${cls || ''}"></i>`; }

function initIcons() {
  if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide' });
}

// ─── User Menu ───────────────────────────────────────

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) menu.classList.toggle('hidden');
}

function toggleMobileUserMenu() {
  const menu = document.getElementById('mobile-user-menu');
  if (menu) menu.classList.toggle('hidden');
}

function handleLogout(e) {
  e.preventDefault();
  if (window.portalAPI) portalAPI('POST', '/api/portal/{clientId}/auth/logout', {});
  alert('You have been logged out.');
}

document.addEventListener('click', function(e) {
  ['user-menu-wrapper', 'mobile-user-menu-wrapper'].forEach(id => {
    const wrapper = document.getElementById(id);
    const menu = document.getElementById(id === 'user-menu-wrapper' ? 'user-menu' : 'mobile-user-menu');
    if (wrapper && menu && !wrapper.contains(e.target)) {
      menu.classList.add('hidden');
    }
  });
});
