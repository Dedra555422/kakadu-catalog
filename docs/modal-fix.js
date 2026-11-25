/* BLACK VAULT — фикс модалки материалов.
   app.js ставит инлайновый display:none на #modal при загрузке,
   из-за чего openModal (hidden = false) не показывает окно. */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    var modal = document.getElementById('modal');
    if (!modal) return;
    modal.style.display = modal.hidden ? 'none' : '';

    var origOpen = window.openModal;
    window.openModal = function (item) {
      if (typeof origOpen === 'function') origOpen(item);
      modal.hidden = false;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };

    var origClose = window.closeModal;
    window.closeModal = function () {
      if (typeof origClose === 'function') origClose();
      modal.hidden = true;
      modal.style.display = '';
      document.body.style.overflow = '';
    };
  });
})();
