(function() {
  var path = window.location.pathname.toLowerCase();
  var isHome = path === '/' || path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('index.html');

  if (isHome) return;

  var referrer = document.referrer;
  var cameFromSameSite = false;

  if (referrer) {
    try {
      cameFromSameSite = new URL(referrer).origin === window.location.origin;
    } catch (error) {
      cameFromSameSite = false;
    }
  }

  if (!cameFromSameSite) {
    window.location.replace('index.html');
  }
})();
