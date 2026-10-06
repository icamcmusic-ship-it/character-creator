/* Runs before the first paint (a plain script in <head>, not deferred). It reads the two stored choices that change
   what the first screen looks like, so the page is laid out once, in its final shape:
     - whether the first-visit card has been dismissed (it used to appear a moment after paint and push the whole form
       down: a layout shift of 0.1 on a desktop and 0.5 on a phone);
     - an explicit light or dark theme (it used to flash the system theme first).
   Keys and prefix match the storage wrapper in app.js. Any failure leaves the defaults, and app.js sets both again. */
(function(){
  try {
    var ls = window.localStorage, root = document.documentElement;
    if (ls.getItem('cc_storage:ui:onboarded')) root.setAttribute('data-onboarded', '1');
    var theme = ls.getItem('cc_storage:ui:theme');
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  } catch (e) {}
})();
