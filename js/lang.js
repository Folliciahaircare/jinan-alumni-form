/* 繁 / 简 switch — converts the visible Traditional text to Simplified in the browser (OpenCC, HK → CN).
   Stored form values stay in Traditional so the Association's data is consistent. */
(function () {
  "use strict";
  var OC = window.OpenCC;
  var conv = OC ? OC.Converter({ from: "hk", to: "cn" }) : null;
  var CJK = /[㐀-鿿]/, ATTRS = ["placeholder", "aria-label", "title"];
  var lang = "hant", orig = new WeakMap(), busy = false;

  function stored() { try { return localStorage.getItem("jnu_lang"); } catch (e) { return null; } }
  function save(l) { try { localStorage.setItem("jnu_lang", l); } catch (e) {} }
  function skipNode(n) {
    var p = n.parentNode;
    return !p || /^(SCRIPT|STYLE|TEXTAREA|OPTION-HIDDEN)$/.test(p.nodeName) || (p.closest && p.closest(".langsw"));
  }

  function text(n) {
    if (skipNode(n)) return;
    var v = n.nodeValue, r = orig.get(n);
    if (lang === "hans") {
      if (r && v === r.c) return;
      if (!CJK.test(v)) return;
      var c = conv(v); orig.set(n, { o: v, c: c });
      if (c !== v) n.nodeValue = c;
    } else if (r) {
      if (v === r.c) n.nodeValue = r.o;
      orig.delete(n);
    }
  }
  function attrs(el) {
    if (el.nodeType !== 1 || (el.closest && el.closest(".langsw"))) return;
    ATTRS.forEach(function (a) {
      var k = "data-o-" + a;
      if (lang === "hans") {
        var v = el.getAttribute(a);
        if (v && CJK.test(v) && !el.hasAttribute(k)) { el.setAttribute(k, v); el.setAttribute(a, conv(v)); }
      } else if (el.hasAttribute(k)) { el.setAttribute(a, el.getAttribute(k)); el.removeAttribute(k); }
    });
  }
  function walk(root) {
    if (root.nodeType === 3) { text(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    var t = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n = t.currentNode;
    do { if (n.nodeType === 3) text(n); else attrs(n); } while ((n = t.nextNode()));
  }

  var mo = new MutationObserver(function (list) {
    if (busy) return; busy = true;
    list.forEach(function (m) {
      if (m.type === "characterData") text(m.target);
      else if (m.type === "attributes") { if (lang === "hans" && !m.target.hasAttribute("data-o-" + m.attributeName)) attrs(m.target); }
      else m.addedNodes.forEach(function (n) { walk(n); });
    });
    mo.takeRecords(); busy = false;
  });

  function set(l, persist) {
    if (l === "hans" && !conv) return;
    lang = l; busy = true;
    document.documentElement.lang = l === "hans" ? "zh-Hans-CN" : "zh-Hant-HK";
    walk(document.documentElement);
    busy = false; mo.takeRecords();
    Array.prototype.forEach.call(document.querySelectorAll(".langsw button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false");
    });
    if (persist) save(l);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".langsw button");
    if (b) set(b.getAttribute("data-lang"), true);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  window.JNU_LANG = { get: function () { return lang; }, set: set };
  var s = stored();
  if (!s) { var nav = (navigator.languages && navigator.languages[0]) || navigator.language || ""; if (/^zh-(CN|SG|Hans)/i.test(nav)) s = "hans"; }
  if (s === "hans") set("hans", false); else set("hant", false);
})();
