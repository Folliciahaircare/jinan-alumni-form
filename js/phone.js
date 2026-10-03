/* Region-aware phone validation, shared in spirit with the Worker (worker/src/index.js validPhone).
   Exposes window.JNU_PHONE = { REGIONS, check(cc, raw, kind), fill(select) }. */
(function () {
  "use strict";
  // cc: dial code (digits) · m: mobile pattern · a: any-line pattern (home/office) · trunk: strip one leading 0
  var REGIONS = [
    { cc: "852", n: { zh: "香港", en: "HK" }, m: /^[4-9]\d{7}$/, a: /^[2-9]\d{7}$/, hint: { zh: "8 位數字，例 9123 4567", en: "8 digits, e.g. 9123 4567" } },
    { cc: "86", n: { zh: "內地", en: "CN" }, m: /^1[3-9]\d{9}$/, a: /^\d{10,12}$/, hint: { zh: "11 位手機號，例 138 0013 8000", en: "11-digit mobile, e.g. 138 0013 8000" } },
    { cc: "853", n: { zh: "澳門", en: "MO" }, m: /^6\d{7}$/, a: /^[268]\d{7}$/, hint: { zh: "8 位數字，例 6612 3456", en: "8 digits, e.g. 6612 3456" } },
    { cc: "886", n: { zh: "台灣", en: "TW" }, m: /^9\d{8}$/, a: /^\d{8,9}$/, trunk: 1, hint: { zh: "9 位手機號（不含開頭 0）", en: "9 digits, without the leading 0" } },
    { cc: "65", n: { zh: "新加坡", en: "SG" }, m: /^[89]\d{7}$/, a: /^[3689]\d{7}$/, hint: { zh: "8 位數字", en: "8 digits" } },
    { cc: "60", n: { zh: "馬來西亞", en: "MY" }, m: /^1\d{8,9}$/, a: /^\d{8,10}$/, trunk: 1, hint: { zh: "不含開頭 0，例 12 345 6789", en: "without the leading 0, e.g. 12 345 6789" } },
    { cc: "1", n: { zh: "美加", en: "US/CA" }, m: /^[2-9]\d{9}$/, a: /^[2-9]\d{9}$/, hint: { zh: "10 位數字", en: "10 digits" } },
    { cc: "44", n: { zh: "英國", en: "UK" }, m: /^7\d{9}$/, a: /^\d{9,10}$/, trunk: 1, hint: { zh: "不含開頭 0，例 7123 456789", en: "without the leading 0, e.g. 7123 456789" } },
    { cc: "61", n: { zh: "澳洲", en: "AU" }, m: /^4\d{8}$/, a: /^\d{9}$/, trunk: 1, hint: { zh: "不含開頭 0，例 412 345 678", en: "without the leading 0, e.g. 412 345 678" } },
    { cc: "81", n: { zh: "日本", en: "JP" }, m: /^[789]0\d{8}$/, a: /^\d{9,10}$/, trunk: 1, hint: { zh: "不含開頭 0，例 90 1234 5678", en: "without the leading 0, e.g. 90 1234 5678" } },
    { cc: "82", n: { zh: "韓國", en: "KR" }, m: /^1\d{8,9}$/, a: /^\d{8,10}$/, trunk: 1, hint: { zh: "不含開頭 0", en: "without the leading 0" } },
    { cc: "", n: { zh: "其他", en: "Other" }, m: /^\d{7,15}$/, a: /^\d{7,15}$/, hint: { zh: "連區號輸入全部數字，例 4915123456789", en: "enter the full number incl. country code, e.g. 4915123456789" } }
  ];
  function region(cc) { for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].cc === cc) return REGIONS[i]; return REGIONS[REGIONS.length - 1]; }

  /** Returns { ok, national, full, region } — `full` is "+CC national" (or "+digits" for Other). */
  function check(cc, raw, kind) {
    var r = region(cc), d = String(raw || "").replace(/[\s\-().]/g, "");
    if (/[^\d+]/.test(d) || d.indexOf("+") > 0) return { ok: false, region: r };
    d = d.replace(/^\+/, "").replace(/^00/, "");
    if (r.cc && d.indexOf(r.cc) === 0 && !(r.m.test(d) || r.a.test(d))) d = d.slice(r.cc.length);   // typed +852… in the number box
    if (r.trunk && d.charAt(0) === "0") d = d.slice(1);
    var ok = (kind === "mobile" ? r.m : r.a).test(d);
    return { ok: ok, national: d, full: ok ? (r.cc ? "+" + r.cc + " " + d : "+" + d) : "", region: r };
  }
  function fill(sel) {
    var pre = function (r) { return r.cc ? "+" + r.cc : "+"; };
    sel.innerHTML = REGIONS.map(function (r) {
      return '<option value="' + r.cc + '" data-zh="' + pre(r) + " " + r.n.zh + '" data-en="' + pre(r) + " " + r.n.en + '">' + pre(r) + " " + r.n.zh + "</option>";
    }).join("");
    sel.value = "852";
  }
  /** If the user pastes "+86 138…" into the number box, switch the region picker and strip the code. */
  function autodetect(sel, input) {
    var v = input.value.replace(/[\s\-().]/g, "");
    if (!/^(\+|00)\d/.test(v)) return;
    var d = v.replace(/^\+/, "").replace(/^00/, "");
    var best = REGIONS.filter(function (r) { return r.cc && d.indexOf(r.cc) === 0; }).sort(function (a, b) { return b.cc.length - a.cc.length; })[0];
    if (best) { sel.value = best.cc; input.value = d.slice(best.cc.length); sel.dispatchEvent(new Event("change", { bubbles: true })); }
  }
  window.JNU_PHONE = { REGIONS: REGIONS, region: region, check: check, fill: fill, autodetect: autodetect };
})();
