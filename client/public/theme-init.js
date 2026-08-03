// Theme init — exécuté avant le chargement de React pour éviter le flash.
// Externalisé depuis index.html pour permettre un CSP strict (script-src 'self').
(function () {
  try {
    var theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
