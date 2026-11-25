/* модалка скрыта с самого начала, независимо от CSS */
(function () {
  var m = document.getElementById('modal');
  if (m) { m.hidden = true; m.style.display = ''; }
})();

/* BLACK VAULT — статический архив */
const MATERIALS = [
  { id: 1, section: 'special', category: 'Методика', title: 'Специальное ОКГ: базовый протокол', body: 'Основной протокол работы со специальным ОКГ. Порядок действий, контрольные точки и типовые ошибки на каждом этапе.', link: '#' },
  { id: 2, section: 'special', category: 'Документация', title: 'Регламент доступа к спецразделу', body: 'Кто и на каких условиях получает доступ к специальному ОКГ, как оформляется заявка и кто её подтверждает.', link: '#' },
  { id: 3, section: 'special', category: 'Практика', title: 'Разбор кейсов: специальное ОКГ', body: 'Подборка разобранных случаев с комментариями администратора. Что сработало, что нет и почему.', link: '#' },
  { id: 4, section: 'regular', category: 'Инструкция', title: 'Обычное ОКГ: старт за 10 минут', body: 'Короткая инструкция для новичков: с чего начать, что подготовить и каких ошибок избегать в первые дни.', link: '#' },
  { id: 5, section: 'regular', category: 'Справочник', title: 'Частые вопросы по обычному ОКГ', body: 'Ответы на вопросы, которые задают чаще всего. Обновляется по мере поступления новых обращений.', link: '#' },
  { id: 6, section: 'regular', category: 'Шаблоны', title: 'Шаблоны документов', body: 'Готовые формы и шаблоны, которые можно использовать при работе с обычным ОКГ.', link: '#' }
];

const sectionNames = { special: 'Специальное ОКГ', regular: 'Обычное ОКГ' };
const state = { query: '', filter: 'all' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function matches(item) {
  if (state.filter !== 'all' && item.section !== state.filter) return false;
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return (item.title + ' ' + item.category + ' ' + item.body).toLowerCase().includes(q);
}

function cardHTML(item) {
  return '<article class="card" data-id="' + item.id + '" tabindex="0">' +
    '<span class="tag">' + item.category + '</span>' +
    '<h3>' + item.title + '</h3>' +
    '<p>' + item.body + '</p>' +
    '<div class="card-foot"><span>' + sectionNames[item.section] + '</span><span class="go">Открыть →</span></div>' +
    '</article>';
}

function render() {
  ['special', 'regular'].forEach(function (sec) {
    const grid = $('#grid-' + sec);
    const empty = $('#empty-' + sec);
    const items = MATERIALS.filter(function (m) { return m.section === sec && matches(m); });
    grid.innerHTML = items.map(cardHTML).join('');
    empty.hidden = items.length > 0;
    const counter = document.querySelector('[data-count="' + sec + '"]');
    if (counter) counter.textContent = items.length;
  });
  const total = MATERIALS.filter(matches).length;
  $('#statTotal').textContent = total;
}

function openModal(item) {
  $('#mTag').textContent = item.category + ' · ' + sectionNames[item.section];
  $('#mTitle').textContent = item.title;
  $('#mBody').textContent = item.body;
  $('#mLink').href = item.link || '#';
  $('#modal').hidden = false; $('#modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').hidden = true; $('#modal').style.display = '';
  document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
  const card = e.target.closest('.card');
  if (card) {
    const item = MATERIALS.find(function (m) { return m.id === Number(card.dataset.id); });
    if (item) openModal(item);
    return;
  }
  if (e.target.closest('[data-close]')) closeModal();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('card')) e.target.click();
});

$('#search').addEventListener('input', function (e) {
  state.query = e.target.value.trim();
  render();
});

$$('#chips .chip').forEach(function (chip) {
  chip.addEventListener('click', function () {
    $$('#chips .chip').forEach(function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    state.filter = chip.dataset.filter;
    render();
  });
});

$('#themeToggle').addEventListener('click', function () {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('bv-theme', next); } catch (err) {}
});

try {
  const saved = localStorage.getItem('bv-theme');
  if (saved) document.documentElement.dataset.theme = saved;
} catch (err) {}

render();


/* === Доступ к разделам по роли (senior_staff и др.) === */
(function () {
  function canSpecial() {
    return !!(window.OKG_ROLES && window.OKG_ROLES.canViewSpecial && window.OKG_ROLES.canViewSpecial());
  }
  function canRegular() {
    return !!(window.OKG_ROLES && window.OKG_ROLES.canViewRegular && window.OKG_ROLES.canViewRegular());
  }
  function apply() {
    var sp = document.getElementById("special");
    var rg = document.getElementById("regular");
    var nav = document.querySelector(".nav-link[href=\"#special\"]");
    var chip = document.querySelector("#chips .chip[data-filter=\"special\"]");
    var s = canSpecial(), r = canRegular();
    if (sp) sp.hidden = !s;
    if (rg) rg.hidden = !r;
    if (nav) nav.hidden = !s;
    if (chip) chip.hidden = !s;
    if (!s) { var g = document.getElementById("grid-special"); if (g) g.innerHTML = ""; }
  }
  window.addEventListener("okg:profile", apply);
  window.addEventListener("storage", apply);
  var n = 0;
  var t = setInterval(function () { apply(); if (++n > 12) clearInterval(t); }, 600);
  apply();
})();
