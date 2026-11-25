/* OKG - роли и уровни доступа. Подключается после auth2.js. */
(function () {
  'use strict';
  var ROLE_LABELS = { tech: 'Технический администратор', head: 'Глава ОКГ', deputy: 'Зам. главы ОКГ', senior_staff: 'Старший сотрудник ОКГ', staff: 'Сотрудник ОКГ', user: 'Пользователь' };
  var ROLE_ORDER = ['tech', 'head', 'deputy', 'senior_staff', 'staff', 'user'];

  /* auth2.js держит currentProfile в области модуля (let), поэтому он не всегда
     виден как window.currentProfile. Собираем профиль из всех источников. */
  function profile() {
    if (window.currentProfile) return window.currentProfile;
    if (window.OKG_AUTH && window.OKG_AUTH.profile) return window.OKG_AUTH.profile;
    if (window.OKG_ADMIN && window.OKG_ADMIN.state && window.OKG_ADMIN.state.profile) return window.OKG_ADMIN.state.profile;
    return null;
  }
  function role(p) {
    var src = p || profile();
    var r = (src && src.role) || 'user';
    if (r === 'admin') r = 'head';
    return ROLE_LABELS[r] ? r : 'user';
  }
  function isTech(p) { return role(p) === 'tech'; }
  function isHead(p) { return role(p) === 'head'; }
  function isDeputy(p) { return role(p) === 'deputy'; }
  function isSeniorStaff(p) { return role(p) === 'senior_staff'; }
  function isStaff(p) { return role(p) === 'staff'; }
  function isDeptMember(p) { return isHead(p) || isDeputy(p) || isSeniorStaff(p) || isStaff(p); }

  /* Спецраздел: техно-админ, глава, зам, старший сотрудник. Обычный сотрудник — НЕТ. */
  function canViewSpecial(p) { return isTech(p) || isHead(p) || isDeputy(p) || isSeniorStaff(p); }
  function canViewRegular(p) { return isTech(p) || isHead(p) || isDeputy(p) || isSeniorStaff(p) || isStaff(p); }
  function canManageUsers(p) { return isTech(p) || isHead(p) || isDeputy(p); }
  function canEditMaterials(p) { return isTech(p) || isHead(p); }
  function canManageRoles(p) { return isTech(p) || isHead(p); }
  function isApproved(p) { var s = p || profile(); return !!(s && s.status === 'approved'); }
  function hasAccess(p) { return isDeptMember(p) || (isApproved(p) && role(p) !== 'user'); }

  window.OKG_ROLES = {
    labels: ROLE_LABELS,
    order: ROLE_ORDER,
    profile: profile,
    role: role,
    roleOf: role,
    label: function (p) { return ROLE_LABELS[role(p)]; },
    isTech: isTech, isHead: isHead, isDeputy: isDeputy,
    isSeniorStaff: isSeniorStaff, isStaff: isStaff, isDeptMember: isDeptMember,
    canViewSpecial: canViewSpecial, canViewRegular: canViewRegular,
    canManageUsers: canManageUsers, canEditMaterials: canEditMaterials,
    canManageRoles: canManageRoles, isApproved: isApproved, hasAccess: hasAccess
  };

  /* Скрытие разделов. Не трогаем данные и state — только видимость. */
  function apply() {
    var s = canViewSpecial(), r = canViewRegular();
    var sp = document.getElementById('special');
    var rg = document.getElementById('regular');
    var nav = document.querySelector('.nav-link[href="#special"]');
    var chip = document.querySelector('#chips .chip[data-filter="special"]');
    var hero = document.querySelector('.hero-actions a[href="#special"]');
    if (sp) sp.hidden = !s;
    if (rg) rg.hidden = !r;
    if (nav) nav.hidden = !s;
    if (chip) chip.hidden = !s;
    if (hero) hero.hidden = !s;
    if (!s) {
      var g = document.getElementById('grid-special');
      if (g) g.innerHTML = '';
      var c = document.querySelector('[data-count="special"]');
      if (c) c.textContent = '0';
    }
  }
  window.okgApplyRoleAccess = apply;

  function announce() {
    apply();
    try { window.dispatchEvent(new CustomEvent('okg:profile', { detail: profile() })); } catch (e) {}
  }
  window.addEventListener('storage', apply);
  document.addEventListener('DOMContentLoaded', announce);
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (profile()) { announce(); clearInterval(iv); }
    if (tries > 40) clearInterval(iv);
  }, 500);
  setTimeout(announce, 1500);
})();
