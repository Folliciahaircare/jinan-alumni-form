/* Language switch: 繁 (Traditional) · 简 (Simplified) · EN (English).
   - Markup carries both languages as <span class="zh">…</span> / <span class="en">…</span>; CSS shows one (html[data-ui]).
   - 简 converts the visible Traditional text in the browser (OpenCC, HK → CN). Stored form values stay Traditional.
   - <option> texts and placeholders (which can't hold markup) use data-zh/data-en and data-ph-zh/data-ph-en. */
(function () {
  "use strict";
  var OC = window.OpenCC;
  var conv = OC ? OC.Converter({ from: "hk", to: "cn" }) : null;
  var CJK = /[㐀-鿿]/, ATTRS = ["placeholder", "aria-label", "title"];
  var mode = "hant", conversion = "hant", orig = new WeakMap(), busy = false;
  var TITLES = { zh: "會員申請表 · 暨南大學香港校友會", en: "Membership Application · Jinan University Hong Kong Alumni Association" };

  function stored() { try { return localStorage.getItem("jnu_lang"); } catch (e) { return null; } }
  function save(l) { try { localStorage.setItem("jnu_lang", l); } catch (e) {} }
  function skipNode(n) {
    var p = n.parentNode;
    return !p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName) || (p.closest && p.closest(".langsw"));
  }

  function text(n) {
    if (skipNode(n)) return;
    var v = n.nodeValue, r = orig.get(n);
    if (conversion === "hans") {
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
      if (conversion === "hans") {
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

  /* options / placeholders / title carry both languages as data attributes */
  function fixOption(o) {
    var want = mode === "en" ? o.getAttribute("data-en") : o.getAttribute("data-zh");
    var cur = o.textContent;
    if (cur === want || (conversion === "hans" && cur === conv(want))) return;
    o.textContent = want;                       // walk() converts it when 简 is active
  }
  function fixPh(el) {
    el.removeAttribute("data-o-placeholder");
    el.setAttribute("placeholder", mode === "en" ? el.getAttribute("data-ph-en") : el.getAttribute("data-ph-zh"));
  }
  function bilingualAttrs(root) {
    root = root || document;
    if (root.nodeType === 1) {
      if (root.matches("option[data-zh]")) fixOption(root);
      if (root.matches("[data-ph-zh]")) fixPh(root);
    }
    Array.prototype.forEach.call(root.querySelectorAll("option[data-zh]"), fixOption);
    Array.prototype.forEach.call(root.querySelectorAll("[data-ph-zh]"), fixPh);
    var tt = mode === "en" ? TITLES.en : TITLES.zh;
    if (root === document && document.title !== tt && !(conversion === "hans" && document.title === conv(tt))) document.title = tt;
  }

  var mo = new MutationObserver(function (list) {
    if (busy) return; busy = true;
    list.forEach(function (m) {
      if (m.type === "characterData") text(m.target);
      else if (m.type === "attributes") { if (conversion === "hans" && !m.target.hasAttribute("data-o-" + m.attributeName)) attrs(m.target); }
      else m.addedNodes.forEach(function (n) { if (n.nodeType === 1) bilingualAttrs(n); walk(n); });
    });
    mo.takeRecords(); busy = false;
  });

  function set(l, persist) {
    if (l === "hans" && !conv) l = "hant";
    mode = l; conversion = l === "hans" ? "hans" : "hant"; busy = true;
    var de = document.documentElement;
    de.setAttribute("data-ui", l === "en" ? "en" : "zh");
    de.lang = l === "en" ? "en" : l === "hans" ? "zh-Hans-CN" : "zh-Hant-HK";
    bilingualAttrs();
    walk(de);
    busy = false; mo.takeRecords();
    Array.prototype.forEach.call(document.querySelectorAll(".langsw button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false");
    });
    if (persist) save(l);
    document.dispatchEvent(new CustomEvent("jnu:lang", { detail: l }));
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".langsw button");
    if (b) set(b.getAttribute("data-lang"), true);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  window.JNU_LANG = { get: function () { return mode; }, set: set, refresh: function () { set(mode, false); } };
  var s = stored();
  if (!/^(hant|hans|en)$/.test(s || "")) {
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    s = /^zh-(CN|SG|Hans)/i.test(nav) ? "hans" : /^en/i.test(nav) ? "en" : "hant";
  }
  set(s, false);
})();
