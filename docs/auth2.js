/* OKG - клиент Supabase, аккаунты, кабинет, админка, защита от копирования */
const SUPABASE_URL = 'https://shbohipthoifdrcpmjtp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYm9oaXB0aG9pZmRyY3BtanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTE5MTUsImV4cCI6MjExMTE4NzkxNX0.UxyoxuAZKviMC76bGA4NdpKzJIxdN9cK_AqLNfofqUo';

let sb = null;
let currentUser = null;
let currentProfile = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

async function loadSession() {
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  currentUser = data && data.session ? data.session.user : null;
  if (currentUser) await loadProfile();
  renderAuthUI();
}

async function loadProfile() {
  if (!sb || !currentUser) { currentProfile = null; return; }
  const { data, error } = await sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
  currentProfile = error ? null : data;
}

function isAdmin() { return !!(currentProfile && currentProfile.role === 'admin'); }
function isApproved() { return !!(currentProfile && currentProfile.status === 'approved'); }

function renderAuthUI() {
  const box = document.getElementById('authArea');
  if (!box) return;
  if (currentUser) {
    const name = (currentProfile && currentProfile.nickname) || currentUser.email;
    const badge = isAdmin() ? 'админ' : (isApproved() ? 'доступ есть' : 'заявка на проверке');
    box.innerHTML = '<span class="user-chip">' + esc(name) + ' · ' + badge + '</span>' +
      '<button class="btn btn-ghost" id="logoutBtn">Выйти</button>';
    const lo = document.getElementById('logoutBtn');
    if (lo) lo.onclick = doLogout;
  } else {
    box.innerHTML = '<button class="btn btn-ghost" id="openLogin">Войти</button>' +
      '<button class="btn btn-primary" id="openRegister">Регистрация</button>';
    const ol = document.getElementById('openLogin');
    const or = document.getElementById('openRegister');
    if (ol) ol.onclick = function () { showAuthModal('login'); };
    if (or) or.onclick = function () { showAuthModal('register'); };
  }
  const adminBtn = document.getElementById('adminNavBtn');
  if (adminBtn) adminBtn.hidden = !isAdmin();
  const cabBtn = document.getElementById('cabinetNavBtn');
  if (cabBtn) cabBtn.hidden = !currentUser;
}

function showAuthModal(mode) {
  const m = document.getElementById('authModal');
  if (!m) return;
  m.hidden = false;
  const lf = document.getElementById('authLoginForm');
  const rf = document.getElementById('authRegForm');
  if (lf) lf.hidden = mode !== 'login';
  if (rf) rf.hidden = mode !== 'register';
  const title = document.getElementById('authModalTitle');
  if (title) title.textContent = mode === 'login' ? 'Вход' : 'Регистрация';
  setAuthMsg('');
}

function hideAuthModal() {
  const m = document.getElementById('authModal');
  if (m) m.hidden = true;
}

function setAuthMsg(text, ok) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = text || '';
  el.className = 'auth-msg' + (ok ? ' ok' : '');
}

async function doRegister(e) {
  e.preventDefault();
  if (!sb) { setAuthMsg('Клиент Supabase не загрузился. Обнови страницу.'); return; }
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const nick = document.getElementById('regNick').value.trim();
  setAuthMsg('Создаём аккаунт…', true);
  const { data, error } = await sb.auth.signUp({
    email: email,
    password: pass,
    options: { data: { nickname: nick }, emailRedirectTo: location.href.split('#')[0] }
  });
  if (error) { setAuthMsg('Ошибка: ' + error.message); return; }
  if (data && data.session) {
    currentUser = data.session.user;
    await loadProfile();
    renderAuthUI();
    hideAuthModal();
    toast('Аккаунт создан. Отправь заявку на доступ.');
    openCabinet();
  } else {
    setAuthMsg('Аккаунт создан. Проверь почту для подтверждения.', true);
  }
}

async function doLogin(e) {
  e.preventDefault();
  if (!sb) { setAuthMsg('Клиент Supabase не загрузился. Обнови страницу.'); return; }
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  setAuthMsg('Входим…', true);
  const { data, error } = await sb.auth.signInWithPassword({ email: email, password: pass });
  if (error) { setAuthMsg('Ошибка: ' + error.message); return; }
  currentUser = data.user;
  await loadProfile();
  renderAuthUI();
  hideAuthModal();
  toast('Вы вошли');
  await refreshMaterials();
  openCabinet();
}

async function doLogout() {
  if (!sb) return;
  await sb.auth.signOut();
  currentUser = null;
  currentProfile = null;
  renderAuthUI();
  await refreshMaterials();
  closeCabinet();
  toast('Вы вышли');
}

async function sendRequest() {
  if (!currentUser) { showAuthModal('login'); return; }
  const msgEl = document.getElementById('reqMessage');
  const message = msgEl ? msgEl.value.trim() : '';
  const { error } = await sb.from('requests').insert({
    user_id: currentUser.id, email: currentUser.email, message: message, status: 'pending'
  });
  if (error) { toast('Ошибка: ' + error.message); return; }
  toast('Заявка отправлена. Ждём одобрения.');
  if (msgEl) msgEl.value = '';
  openCabinet();
}

function statusClass(s) {
  return s === 'approved' ? 'ok' : (s === 'rejected' ? 'bad' : 'wait');
}

async function openCabinet() {
  const sec = document.getElementById('cabinet');
  if (!sec || !currentUser) return;
  sec.hidden = false;
  const em = document.getElementById('cabEmail');
  if (em) em.textContent = currentUser.email || '';
  const st = document.getElementById('cabStatus');
  if (st) {
    st.textContent = isAdmin() ? 'Администратор' : (isApproved() ? 'Доступ одобрен' : 'Заявка на проверке');
    st.className = 'status-pill ' + (isAdmin() || isApproved() ? 'ok' : 'wait');
  }
  const { data } = await sb.from('requests').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  const list = document.getElementById('cabRequests');
  if (list) {
    if (!data || !data.length) {
      list.innerHTML = '<p class="muted">Заявок пока нет.</p>';
    } else {
      list.innerHTML = data.map(function (r) {
        return '<div class="req-row"><span>' + new Date(r.created_at).toLocaleString('ru-RU') + '</span>' +
          '<span class="status-pill ' + statusClass(r.status) + '">' + esc(r.status) + '</span>' +
          '<span class="muted">' + esc(r.message || '') + '</span></div>';
      }).join('');
    }
  }
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCabinet() {
  const sec = document.getElementById('cabinet');
  if (sec) sec.hidden = true;
}

async function openAdmin() {
  const sec = document.getElementById('admin');
  if (!sec) return;
  if (!isAdmin()) { toast('Нужны права администратора'); return; }
  sec.hidden = false;
  await loadAdminData();
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadAdminData() {
  const { data: reqs } = await sb.from('requests').select('*').order('created_at', { ascending: false });
  const box = document.getElementById('adminRequests');
  if (box) {
    if (!reqs || !reqs.length) {
      box.innerHTML = '<p class="muted">Заявок нет.</p>';
    } else {
      box.innerHTML = reqs.map(function (r) {
        return '<div class="req-row">' +
          '<span>' + esc(r.email || '') + '</span>' +
          '<span class="muted">' + esc(r.message || '') + '</span>' +
          '<span class="status-pill ' + statusClass(r.status) + '">' + esc(r.status) + '</span>' +
          '<button class="btn btn-ghost btn-sm" data-approve="' + r.id + '">Одобрить</button>' +
          '<button class="btn btn-ghost btn-sm" data-reject="' + r.id + '">Отклонить</button>' +
          '</div>';
      }).join('');
      box.querySelectorAll('[data-approve]').forEach(function (b) {
        b.onclick = function () { setRequestStatus(b.dataset.approve, 'approved'); };
      });
      box.querySelectorAll('[data-reject]').forEach(function (b) {
        b.onclick = function () { setRequestStatus(b.dataset.reject, 'rejected'); };
      });
    }
  }

  const { data: profs } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  const pb = document.getElementById('adminUsers');
  if (pb) {
    if (!profs || !profs.length) {
      pb.innerHTML = '<p class="muted">Пользователей нет.</p>';
    } else {
      pb.innerHTML = profs.map(function (p) {
        return '<div class="req-row">' +
          '<span>' + esc(p.email || '') + '</span>' +
          '<span class="muted">' + esc(p.nickname || '') + '</span>' +
          '<span class="status-pill ' + statusClass(p.status) + '">' + esc(p.status) + '</span>' +
          '<span class="muted">' + esc(p.role) + '</span>' +
          '<button class="btn btn-ghost btn-sm" data-papprove="' + p.id + '">Доступ</button>' +
          '<button class="btn btn-ghost btn-sm" data-pblock="' + p.id + '">Забрать</button>' +
          '</div>';
      }).join('');
      pb.querySelectorAll('[data-papprove]').forEach(function (b) {
        b.onclick = function () { setProfileStatus(b.dataset.papprove, 'approved'); };
      });
      pb.querySelectorAll('[data-pblock]').forEach(function (b) {
        b.onclick = function () { setProfileStatus(b.dataset.pblock, 'pending'); };
      });
    }
  }
  await renderAdminMaterials();
}

async function setRequestStatus(id, status) {
  const { error } = await sb.from('requests').update({ status: status }).eq('id', id);
  if (error) { toast('Ошибка: ' + error.message); return; }
  toast('Статус заявки обновлён');
  await loadAdminData();
}

async function setProfileStatus(id, status) {
  const { error } = await sb.from('profiles').update({ status: status }).eq('id', id);
  if (error) { toast('Ошибка: ' + error.message); return; }
  toast('Статус пользователя обновлён');
  await loadAdminData();
}

async function renderAdminMaterials() {
  const { data } = await sb.from('materials').select('*').order('created_at', { ascending: false });
  const box = document.getElementById('adminMaterials');
  if (!box) return;
  if (!data || !data.length) { box.innerHTML = '<p class="muted">Материалов нет.</p>'; return; }
  box.innerHTML = data.map(function (m) {
    return '<div class="req-row">' +
      '<span>' + esc(m.title) + '</span>' +
      '<span class="muted">' + esc(m.category) + '</span>' +
      '<span class="muted">' + esc(m.section) + '</span>' +
      '<button class="btn btn-ghost btn-sm" data-delmat="' + m.id + '">Удалить</button>' +
      '</div>';
  }).join('');
  box.querySelectorAll('[data-delmat]').forEach(function (b) {
    b.onclick = function () { deleteMaterial(b.dataset.delmat); };
  });
}

async function addMaterial(e) {
  e.preventDefault();
  const title = document.getElementById('matTitle').value.trim();
  const category = document.getElementById('matCategory').value.trim() || 'Материал';
  const section = document.getElementById('matSection').value;
  const description = document.getElementById('matDesc').value.trim();
  const link = document.getElementById('matLink').value.trim();
  if (!title) { toast('Введите название'); return; }
  const { error } = await sb.from('materials').insert({
    title: title, category: category, section: section, description: description, link: link
  });
  if (error) { toast('Ошибка: ' + error.message); return; }
  document.getElementById('matForm').reset();
  toast('Материал добавлен');
  await renderAdminMaterials();
  await refreshMaterials();
}

async function deleteMaterial(id) {
  const { error } = await sb.from('materials').delete().eq('id', id);
  if (error) { toast('Ошибка: ' + error.message); return; }
  toast('Материал удалён');
  await renderAdminMaterials();
  await refreshMaterials();
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

function toast(text) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
}

/* Защита от копирования */
function protectContent() {
  const isField = function (el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  };
  document.addEventListener('copy', function (e) {
    if (isField(e.target)) return;
    e.preventDefault();
    toast('Копирование материалов запрещено');
  });
  document.addEventListener('cut', function (e) {
    if (isField(e.target)) return;
    e.preventDefault();
  });
  document.addEventListener('contextmenu', function (e) {
    if (isField(e.target)) return;
    e.preventDefault();
    toast('Правая кнопка отключена');
  });
  document.addEventListener('dragstart', function (e) {
    if (isField(e.target)) return;
    e.preventDefault();
  });
  document.addEventListener('selectstart', function (e) {
    if (isField(e.target)) return;
    e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    if (isField(e.target)) return;
    const k = (e.key || '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    const blocked =
      (mod && (k === 'c' || k === 'x' || k === 'a' || k === 'u' || k === 's' || k === 'p')) ||
      (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
      k === 'f12';
    if (blocked) {
      e.preventDefault();
      toast('Действие заблокировано');
    }
  });
}

window.addEventListener('DOMContentLoaded', function () {
  protectContent();
  initSupabase();
  loadSession();
  const lf = document.getElementById('authLoginForm');
  const rf = document.getElementById('authRegForm');
  if (lf) lf.onsubmit = doLogin;
  if (rf) rf.onsubmit = doRegister;
  const mf = document.getElementById('matForm');
  if (mf) mf.onsubmit = addMaterial;
  const reqBtn = document.getElementById('sendReqBtn');
  if (reqBtn) reqBtn.onclick = sendRequest;
  document.querySelectorAll('[data-close-auth]').forEach(function (el) { el.onclick = hideAuthModal; });
  const sw1 = document.getElementById('toRegister');
  if (sw1) sw1.onclick = function (e) { e.preventDefault(); showAuthModal('register'); };
  const sw2 = document.getElementById('toLogin');
  if (sw2) sw2.onclick = function (e) { e.preventDefault(); showAuthModal('login'); };
  const cabBtn = document.getElementById('cabinetNavBtn');
  if (cabBtn) cabBtn.onclick = function (e) { e.preventDefault(); openCabinet(); };
  const admBtn = document.getElementById('adminNavBtn');
  if (admBtn) admBtn.onclick = function (e) { e.preventDefault(); openAdmin(); };
});
