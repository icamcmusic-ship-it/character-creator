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

/* Inline styles without 'unsafe-inline': markup carries `data-st="prop:value;…"` instead of `style="…"`, and this applies each
   declaration through the CSSOM (which the Content-Security-Policy allows) as soon as the node is parsed or inserted, then removes
   the attribute. A tiny stylesheet rule keeps `display:none` ones hidden for the instant before they are processed. */
(function(){
  function apply(el){
    var s = el.getAttribute('data-st');
    if (!s) return;
    el.removeAttribute('data-st');
    s.split(';').forEach(function(d){
      var i = d.indexOf(':');
      if (i < 1) return;
      var p = d.slice(0, i).trim(), v = d.slice(i + 1).trim(), imp = '';
      if (/!important$/i.test(v)){ v = v.replace(/\s*!important$/i, ''); imp = 'important'; }
      if (p && v) el.style.setProperty(p, v, imp);
    });
  }
  function sweep(node){
    if (!node || node.nodeType !== 1) return;
    if (node.hasAttribute('data-st')) apply(node);
    var all = node.querySelectorAll ? node.querySelectorAll('[data-st]') : [];
    for (var i = 0; i < all.length; i++) apply(all[i]);
  }
  window.applyDataStyles = sweep;
  try {
    new MutationObserver(function(list){
      for (var i = 0; i < list.length; i++){
        var m = list[i];
        if (m.type === 'attributes') apply(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) sweep(m.addedNodes[j]);
      }
    }).observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-st']});
  } catch (e) {}
  document.addEventListener('DOMContentLoaded', function(){ sweep(document.documentElement); });
})();
