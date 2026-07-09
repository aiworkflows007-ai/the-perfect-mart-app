// The Perfect Mart — Admin mobile responsiveness layer (companion to admin-responsive.css).
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var aside = document.querySelector('aside');
    var main = document.querySelector('main');
    if (!aside) return;
    aside.classList.add('pm-nav-sidebar');
    if (main) main.classList.add('pm-main-content');

    var btn = document.createElement('button');
    btn.className = 'pm-hamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.innerHTML = '<span class="material-symbols-outlined">menu</span>';

    var backdrop = document.createElement('div');
    backdrop.className = 'pm-sidebar-backdrop';

    document.body.appendChild(backdrop);
    document.body.appendChild(btn);

    function toggle() {
      aside.classList.toggle('pm-sidebar-open');
      backdrop.classList.toggle('pm-open');
    }
    btn.addEventListener('click', toggle);
    backdrop.addEventListener('click', toggle);
  });
})();
