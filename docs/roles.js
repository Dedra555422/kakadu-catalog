/* OKG - три уровня доступа: глава, зам, сотрудник.
   Подключается после auth2.js и переопределяет проверки прав. */
(function () {
  'use strict';

  var ROLE_LABELS = {
    head: 'Глава ОКГ',
    deputy: 'Зам. главы ОКГ',
    staff: 'Сотрудник ОКГ',
    user: 'Пользователь'
  };

  function role() {
    return (window.currentProfile && window.currentProfile.role) || 'user';
  }
  function isHead() { return role() === 'head'; }
  function isDeputy() { return role() === 'deputy'; }
  function isStaff() { return role() === 'staff'; }
  function isDeptMember() { return isHead() || isDeputy() || isStaff(); }
  function canManageUsers() { return isHead() || isDeputy(); }
  function canEditMaterials() { return isHead(); }
  function isApproved() {
    return !!(window.currentProfile && window.currentProfile.status === 'approved');
  }
  function hasAccess() { return isDeptMember() || isApproved(); }

  window.OKG_ROLES = {
    labels: ROLE_LABELS,
    role: role,
    isHead: isHead,
    isDeputy: isDeputy,
    isStaff: isStaff,
    isDeptMember: isDeptMember,
    canManageUsers: canManageUsers,
    canEditMaterials: canEditMaterials,
    isApproved: isApproved,
    hasAccess: hasAccess
  };
})();
