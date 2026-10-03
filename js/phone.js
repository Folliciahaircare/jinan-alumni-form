/* Region-aware phone validation, shared in spirit with the Worker (worker/src/index.js validPhone).
   Exposes window.JNU_PHONE = { REGIONS, check(cc, raw, kind), fill(select) }. */
(function () {
  "use strict";
  // cc: dial code (digits) · m: mobile pattern · a: any-line pattern (home/office) · trunk: strip one leading 0
  var REGIONS = [
    { cc: "852", n: "香港 HK", m: /^[4-9]\d{7}$/, a: /^[2-9]\d{7}$/, hint: "8 位數字 8 digits，例 e.g. 9123 4567" },
    { cc: "86", n: "內地 CN", m: /^1[3-9]\d{9}$/, a: /^\d{10,12}$/, hint: "11 位手機號 11-digit mobile，例 e.g. 138 0013 8000" },
    { cc: "853", n: "澳門 MO", m: /^6\d{7}$/, a: /^[268]\d{7}$/, hint: "8 位數字 8 digits，例 e.g. 6612 3456" },
    { cc: "886", n: "台灣 TW", m: /^9\d{8}$/, a: /^\d{8,9}$/, trunk: 1, hint: "9 位手機（不含開頭 0） 9 digits without leading 0" },
    { cc: "65", n: "新加坡 SG", m: /^[89]\d{7}$/, a: /^[3689]\d{7}$/, hint: "8 位數字 8 digits" },
    { cc: "60", n: "馬來西亞 MY", m: /^1\d{8,9}$/, a: /^\d{8,10}$/, trunk: 1, hint: "不含開頭 0 without leading 0，例 e.g. 12 345 6789" },
    { cc: "1", n: "美加 US/CA", m: /^[2-9]\d{9}$/, a: /^[2-9]\d{9}$/, hint: "10 位數字 10 digits" },
    { cc: "44", n: "英國 UK", m: /^7\d{9}$/, a: /^\d{9,10}$/, trunk: 1, hint: "不含開頭 0 without leading 0，例 e.g. 7123 456789" },
    { cc: "61", n: "澳洲 AU", m: /^4\d{8}$/, a: /^\d{9}$/, trunk: 1, hint: "不含開頭 0 without leading 0，例 e.g. 412 345 678" },
    { cc: "81", n: "日本 JP", m: /^[789]0\d{8}$/, a: /^\d{9,10}$/, trunk: 1, hint: "不含開頭 0 without leading 0，例 90 1234 5678" },
    { cc: "82", n: "韓國 KR", m: /^1\d{8,9}$/, a: /^\d{8,10}$/, trunk: 1, hint: "不含開頭 0 without leading 0" },
    { cc: "", n: "其他 Other", m: /^\d{7,15}$/, a: /^\d{7,15}$/, hint: "連區號輸入全部數字 enter full number incl. country code，例 e.g. 4915123456789" }
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
    sel.innerHTML = REGIONS.map(function (r) { return '<option value="' + r.cc + '">' + (r.cc ? "+" + r.cc : "+") + " " + r.n + "</option>"; }).join("");
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
