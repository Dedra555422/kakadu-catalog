/* OKG - роли и уровни доступа. Подключается после auth2.js. */
(function () {
  'use strict';

  var ROLE_LABELS = {
    tech: 'Технический администратор',
    head: 'Глава ОКГ',
    deputy: 'Зам. главы ОКГ',
    senior_staff: 'Старший сотрудник ОКГ',
    staff: 'Сотрудник ОКГ',
    user: 'Пользователь'
  };

  var ROLE_ORDER = ['tech', 'head', 'deputy', 'senior_staff', 'staff', 'user'];

  function role() {
    var r = (window.currentProfile && window.currentProfile.role) || 'user';
    if (r === 'admin') r = 'head';
    return ROLE_LABELS[r] ? r : 'user';
  }

  function isTech() { return role() === 'tech'; }
  function isHead() { return role() === 'head'; }
  function isDeputy() { return role() === 'deputy'; }
  function isSeniorStaff() { return role() === 'senior_staff'; }
  function isStaff() { return role() === 'staff'; }

  function isDeptMember() {
    return isHead() || isDeputy() || isSeniorStaff() || isStaff();
  }

  /* Спецраздел ОКГ: техно-админ, глава, зам, старший сотрудник. Обычный сотрудник — НЕТ. */
  function canViewSpecial() {
    return isTech() || isHead() || isDeputy() || isSeniorStaff();
  }

  function canViewRegular() {
    return isTech() || isHead() || isDeputy() || isSeniorStaff() || isStaff();
  }

  function canManageUsers() { return isTech() || isHead() || isDeputy(); }
  function canEditMaterials() { return isTech() || isHead(); }
  function canManageRoles() { return isTech() || isHead(); }

  function isApproved() {
    return !!(window.currentProfile && window.currentProfile.status === 'approved');
  }

  function hasAccess() {
    return isDeptMember() || (isApproved() && role() !== 'user');
  }

  window.OKG_ROLES = {
    labels: ROLE_LABELS,
    order: ROLE_ORDER,
    role: role,
    roleOf: function (p) {
      var r = (p && p.role) || 'user';
      if (r === 'admin') r = 'head';
      return ROLE_LABELS[r] ? r : 'user';
    },
    label: function (p) { return ROLE_LABELS[this.roleOf(p)]; },
    isTech: isTech,
    isHead: isHead,
    isDeputy: isDeputy,
    isSeniorStaff: isSeniorStaff,
    isStaff: isStaff,
    isDeptMember: isDeptMember,
    canViewSpecial: canViewSpecial,
    canViewRegular: canViewRegular,
    canManageUsers: canManageUsers,
    canEditMaterials: canEditMaterials,
    canManageRoles: canManageRoles,
    isApproved: isApproved,
    hasAccess: hasAccess
  };
})();
