// The Perfect Mart — static-credential auth guard for Admin & Rider apps.
// No self-registration: credentials are issued by the business owner, not created by users.
(function (global) {
  const ADMIN_KEY = 'pm_admin_auth_v1';
  const RIDER_KEY = 'pm_rider_auth_v1';

  // Change these to rotate credentials. Distribute them directly to staff/riders.
  const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
  const RIDER_CREDENTIALS = { username: 'rider', password: 'rider123' };

  function isAdminAuthed() {
    return localStorage.getItem(ADMIN_KEY) === '1';
  }
  function loginAdmin(username, password) {
    const ok = username.trim().toLowerCase() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
    if (ok) localStorage.setItem(ADMIN_KEY, '1');
    return ok;
  }
  function logoutAdmin() {
    localStorage.removeItem(ADMIN_KEY);
  }
  function guardAdmin() {
    if (!isAdminAuthed()) {
      location.href = '../admin_login/code.html';
    }
  }

  function isRiderAuthed() {
    return localStorage.getItem(RIDER_KEY) === '1';
  }
  function loginRider(username, password) {
    const ok = username.trim().toLowerCase() === RIDER_CREDENTIALS.username && password === RIDER_CREDENTIALS.password;
    if (ok) localStorage.setItem(RIDER_KEY, '1');
    return ok;
  }
  function logoutRider() {
    localStorage.removeItem(RIDER_KEY);
  }
  function guardRider() {
    if (!isRiderAuthed()) {
      location.href = '../rider_login/code.html';
    }
  }

  global.PMAuth = {
    isAdminAuthed, loginAdmin, logoutAdmin, guardAdmin,
    isRiderAuthed, loginRider, logoutRider, guardRider
  };
})(window);
