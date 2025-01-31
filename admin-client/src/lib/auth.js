/* global API_URL */
import page from 'page';
import { session } from '../stores';

const apiUrl = API_URL;

const calcWindow = () => ({
  width: 800,
  height: 800,
  left: window.screen.width / 2 - 800 / 2,
  top: window.screen.height / 2 - 800 / 2,
});

// async
function externalAuth(path, action, hidden = false) {
  return new Promise((resolve, reject) => {
    const url = `${apiUrl}${path}`;
    let opts;
    if (hidden) {
      opts = 'width=1,height=1,top=0,left=0';
    } else {
      const { width, height, top, left } = calcWindow();
      opts = `resizable=yes,scrollbars=yes,width=${width},height=${height},top=${top},left=${left}`;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Window/open
    // force popup to prevent the tab from not handling auth redirects
    opts += ',popup=true';

    const authWindow = window.open(url, 'authWindow', opts);

    const handleMessage = (e) => {
      if (e.origin === apiUrl && e.data === 'success') {
        authWindow.close();
        return resolve(true);
      }
      return reject(new Error(`${action} failed`));
    };

    window.addEventListener('message', handleMessage, { once: true });

    if (!hidden) {
      authWindow.focus();
    }
  });
}

// async
function authenticate() {
  return externalAuth('/admin/login', 'Authentication');
}

// async
function deauthenticate() {
  return externalAuth('/admin/logout', 'Logout', true);
}

function init() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      session.login(user);
    }
  } catch (_) {
    // do nothing
  }
}

function login(user) {
  localStorage.setItem('user', JSON.stringify(user));
  session.login(user);
  page.redirect('/');
}

function logout() {
  localStorage.removeItem('user');
  session.logout();
  page('/login');
}

export { authenticate, deauthenticate, init, login, logout };
