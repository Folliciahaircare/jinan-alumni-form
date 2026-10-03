(function () {
  "use strict";
  var C = window.JNU_CONFIG || {};
  var PICS_VERSION = "2026-10-03";   // bump whenever the statement or consent wording changes; stored with each consent
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var form = $("#form"), steps = $$(".step"), stepNav = $$("#steps li");
  var btnBack = $("#btnBack"), btnNext = $("#btnNext"), btnSubmit = $("#btnSubmit");
  var errBox = $("#formError");
  var cur = 0, openedAt = Date.now();
  var files = { doc: null, pay: null }, pending = 0;

  /* ---------- language helpers ---------- */
  // bi(): trusted constant strings only (never user data). Both languages are emitted; CSS shows the active one.
  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }
  function setBi(el, zh, en, hans) {   // safe for any text, including config / user values
    el.textContent = "";
    var a = document.createElement("span"), b = document.createElement("span");
    if (hans) a.setAttribute("data-hans", hans);
    a.className = "zh"; a.textContent = zh; b.className = "en"; b.textContent = en;
    el.appendChild(a); el.appendChild(b);
  }
  function lang() { return window.JNU_LANG ? JNU_LANG.get() : "hant"; }

  /* config text values: "plain" or { hant, hans, en } → { zh (Traditional), hans (Simplified or ""), en } */
  var toHans = window.OpenCC ? OpenCC.Converter({ from: "hk", to: "cn" }) : function (x) { return x; };
  function tr(v) {
    if (v == null) return { zh: "", hans: "", en: "" };
    if (typeof v !== "object") { v = String(v); return { zh: v, hans: "", en: v }; }
    var zh = v.hant || v.hans || v.en || "";
    return { zh: zh, hans: v.hans || "", en: v.en || v.hant || v.hans || "" };
  }
  function isEmpty(t) { return !(t.zh || t.hans || t.en); }
  function setZhText(el, t) {   // single element that carries the Chinese text (Simplified override via data-hans)
    if (t.hans) el.setAttribute("data-hans", t.hans); else el.removeAttribute("data-hans");
    el.textContent = t.zh;
  }

  /* ---------- config → page ---------- */
  var ORG = tr(C.ORG || { hant: C.ORG_ZH, en: C.ORG_EN });
  setZhText($("#orgZh"), ORG); $("#orgEn").textContent = ORG.en;
  setZhText($("#footZh"), ORG); $("#footEn").textContent = ORG.en;
  if (C.LOGO) $("#logo").src = C.LOGO;
  $("#yr").textContent = new Date().getFullYear();
  $$(".mb").forEach(function (e) { e.textContent = C.MAX_FILE_MB; });
  $$(".feeNum").forEach(function (e) { e.textContent = C.FEE_BASIC; });
  $("#feeBasic").textContent = "HK$" + C.FEE_BASIC;
  if (!C.ENDPOINT) $("#demoBanner").hidden = false;
  if (C.CONTACT && C.CONTACT.website) $("#homeLink").href = "https://" + C.CONTACT.website.replace(/^https?:\/\//, "");

  function contactLines() {   // each item: Traditional label+value, Simplified (own value or converted), English
    var c = C.CONTACT || {}, z = [], h = [], e = [];
    function add(zhLabel, enLabel, t) {
      if (isEmpty(t)) return;
      z.push(zhLabel + "：" + t.zh); h.push(toHans(zhLabel) + "：" + (t.hans || toHans(t.zh))); e.push(enLabel + ": " + t.en);
    }
    add("地址", "Address", tr(c.address)); add("電話", "Tel", tr(c.phone)); add("傳真", "Fax", tr(c.fax));
    add("WhatsApp", "WhatsApp", tr(c.whatsapp)); add("電郵", "Email", tr(c.email));
    return { any: z.length > 0, zh: z.join("　|　"), hans: h.join("　|　"), en: e.join("  |  ") };
  }
  var cl = contactLines();
  var site = (C.CONTACT && C.CONTACT.website) || "";
  var cZh = cl.any ? cl.zh : (site ? "網站：" + site : ""), cEn = cl.any ? cl.en : (site ? "Website: " + site : "");
  var cHans = cl.any ? cl.hans : (site ? "网站：" + site : "");
  $("#picsContact").textContent = cEn ? "Contact the Association: " + cEn : "";
  setZhText($("#picsContactZh"), { zh: cZh ? "聯絡本會：" + cZh : "", hans: cHans ? "联络本会：" + cHans : "" });
  if (cl.any) setBi($("#doneContact"), "如有查詢，請聯絡我們：" + cl.zh, "For enquiries: " + cl.en, "如有查询，请联络我们：" + cl.hans); else $("#doneContact").textContent = "";

  function fillDl(id, rows) {
    var dl = $(id); dl.innerHTML = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      setBi(dt, r[0][0], r[0][1]);
      var t = tr(r[1]);
      if (isEmpty(t)) { dd.innerHTML = bi("待公佈", "To be confirmed"); dd.className = "tbc"; }
      else if (typeof r[1] === "object") setBi(dd, t.zh, t.en, t.hans);
      else dd.textContent = t.zh;
      dl.appendChild(dt); dl.appendChild(dd);
    });
  }
  var P = C.PAYMENT || {};
  fillDl("#payInPerson", [[["地址", "Address"], P.officeAddress], [["辦公時間", "Hours"], P.officeHours]]);
  fillDl("#payCheque", [[["抬頭", "Payable to"], P.chequePayableTo], [["郵寄地址", "Mail to"], P.officeAddress]]);
  fillDl("#payBank", [[["存入戶口名稱", "Account name"], P.payee], [["銀行", "Bank"], P.bank], [["帳號", "Account no."], P.account], [["傳真入數紙至", "Fax the pay-in slip to"], C.CONTACT && C.CONTACT.fax], [["轉數快", "FPS"], P.fps]]);

  /* ---------- phone region pickers ---------- */
  var PH = window.JNU_PHONE;
  [["mobile", "mobile"]].forEach(function (p) {
    var sel = $("#" + p[0] + "Cc"), inp = $("#" + p[0]);
    PH.fill(sel);
    function hint() { if (p[0] !== "mobile") return; var h = PH.region(sel.value).hint; setBi($("#mobileHint"), h.zh, h.en); }
    sel.addEventListener("change", hint); hint();
    inp.addEventListener("input", function () { PH.autodetect(sel, inp); });
  });
  function phoneFull(id, kind) {
    var raw = val(id); if (!raw) return "";
    var r = PH.check($("#" + id + "Cc").value, raw, kind); return r.ok ? r.full : raw;
  }

  /* ---------- year selects / dates ---------- */
  var thisYear = new Date().getFullYear();
  function yearOptions(sel, from, to) {
    var h = '<option value="" data-zh="— 年份 —" data-en="— Year —">— 年份 —</option>';
    for (var y = to; y >= from; y--) h += "<option>" + y + "</option>";
    sel.innerHTML = h;
  }
  yearOptions($("#gradYear"), 1906, thisYear + 8);   // Jinan founded 1906
  yearOptions($("#pe1Year"), 1950, thisYear + 8);
  yearOptions($("#pe2Year"), 1950, thisYear + 8);
  $("#peAdd").addEventListener("click", function () { $("#peRow2").hidden = false; this.parentNode.hidden = true; });
  var today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $("#dob").max = today;
  $("#signDate").value = today;

  /* ---------- step navigation ---------- */
  function show(n) {
    cur = n;
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    stepNav.forEach(function (li, i) {
      li.className = i < n ? "done" : i === n ? "on" : "";
      if (i < n) li.firstChild.textContent = "✓"; else li.firstChild.textContent = i + 1;
    });
    btnBack.hidden = n === 0;
    btnNext.hidden = n === steps.length - 1;
    btnSubmit.hidden = n !== steps.length - 1;
    hideError();
    if (n === steps.length - 1) { buildSummary(); initTurnstile(); }
    var top = $(".title").getBoundingClientRect().top + window.pageYOffset - 8;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function showError(html) { errBox.innerHTML = html; errBox.hidden = false; }
  function hideError() { errBox.hidden = true; }

  function memberType() { var r = $('input[name="memberType"]:checked'); return r ? r.value : ""; }

  /* ---------- validation ---------- */
  function clearInvalid(scope) { $$(".invalid", scope).forEach(function (e) { e.classList.remove("invalid"); }); $$(".msg", scope).forEach(function (e) { e.remove(); }); }
  function mark(el, msg) {
    var f = el.closest(".field") || el.closest(".choice") || el.parentNode;
    f.classList.add("invalid");
    if (msg && !f.querySelector(".msg")) { var m = document.createElement("div"); m.className = "msg"; m.innerHTML = msg; f.appendChild(m); }
  }
  var MSG = bi("此欄必填", "Required");

  function validateStep(n) {
    var sec = steps[n], bad = [], seen = {};
    clearInvalid(sec);
    $$("input,select,textarea", sec).forEach(function (el) {
      if (el.type === "file" || el.closest("[hidden]") || el.disabled) return;
      if (el.type === "radio") {
        if (seen[el.name]) return; seen[el.name] = 1;
        if (el.required && !$('input[name="' + el.name + '"]:checked', sec)) { mark(el, MSG); bad.push(el); }
        return;
      }
      if (el.type === "checkbox") {
        if (el.required && !el.checked) { mark(el, MSG); bad.push(el); }
        return;
      }
      var v = el.value.trim();
      if (el.required && !v) { mark(el, MSG); bad.push(el); return; }
      if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { mark(el, bi("電郵格式不正確", "Invalid email")); bad.push(el); }
      if (v && el.name === "mobile") {
        var pr = PH.check($("#mobileCc").value, v, "mobile");
        if (!pr.ok) { mark(el, bi("電話號碼與所選地區不符，請檢查（" + pr.region.hint.zh + "）", "Number doesn't match the selected region (" + pr.region.hint.en + ")")); bad.push(el); }
      }
      if (v && el.name === "hkid" && !/^[A-Za-z]{1,2}\d{6}\(?[0-9Aa]\)?$/.test(v.replace(/\s/g, ""))) { mark(el, bi("格式例：A123456(7)", "Format: A123456(7)")); bad.push(el); }
    });
    if (n === 1) {   // prior education: a qualification / field / year needs an institution name
      [1, 2].forEach(function (i) {
        if ($("#peRow" + i).hidden) return;
        var any = $("#pe" + i + "Level").value || val("pe" + i + "Field") || $("#pe" + i + "Year").value;
        if (any && !val("pe" + i + "Inst")) { mark($("#pe" + i + "Inst"), bi("請填寫院校名稱", "Please enter the institution")); bad.push($("#pe" + i + "Inst")); }
      });
    }
    if (n === 3) {
      if (memberType() === "basic" && !$('input[name="payMethod"]:checked')) {
        mark($('input[name="payMethod"]'), bi("請選擇繳費方式", "Select a payment method")); bad.push($('input[name="payMethod"]'));
      }
      if (memberType() === "student" && !files.doc) {
        mark($("#docFile"), bi("學生會員請上傳學生證", "Student card required")); bad.push($("#docFile"));
      }
    }
    if (bad.length) {
      showError(bi("請檢查標示的欄位。", "Please check the highlighted fields."));
      bad[0].scrollIntoView({ behavior: "smooth", block: "center" });
      if (bad[0].focus && bad[0].type !== "radio") bad[0].focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  btnNext.addEventListener("click", function () { if (validateStep(cur)) show(cur + 1); });
  btnBack.addEventListener("click", function () { show(cur - 1); });
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && cur < steps.length - 1) { e.preventDefault(); btnNext.click(); }
  });
  form.addEventListener("input", function (e) { var f = e.target.closest(".invalid"); if (f) { f.classList.remove("invalid"); var m = f.querySelector(".msg"); if (m) m.remove(); } });

  /* ---------- "other" reveal fields ---------- */
  function otherToggle(selId, otherId, test, wrapId) {
    var sel = $("#" + selId), o = $("#" + (wrapId || otherId));
    function f() { o.hidden = !test(sel.value); }
    sel.addEventListener("change", f); f();
  }
  otherToggle("college", "collegeOther", function (v) { return v === "其他"; });
  otherToggle("industry", "industryOther", function (v) { return /^其他/.test(v); });
  otherToggle("district", "districtOther", function (v) { return /^香港以外/.test(v); }, "districtOtherWrap");

  /* ---------- membership / payment toggles ---------- */
  function syncMembership() {
    var t = memberType();
    $("#paySection").hidden = t !== "basic";
    syncPay();
  }
  function syncPay() {
    var m = $('input[name="payMethod"]:checked'), v = m ? m.value : "";
    $$(".paybox[data-pay]").forEach(function (b) { b.hidden = b.getAttribute("data-pay") !== v; });
    $("#payProofWrap").hidden = !(v && v.indexOf("In person") < 0);
  }
  $$('input[name="memberType"]').forEach(function (r) { r.addEventListener("change", syncMembership); });
  $$('input[name="payMethod"]').forEach(function (r) { r.addEventListener("change", syncPay); });

  /* ---------- file handling (photos are resized in the browser) ---------- */
  var MAXB = C.MAX_FILE_MB * 1024 * 1024, KEEP = 1.5 * 1024 * 1024, MAXDIM = 2000;
  function loadBitmap(f) {
    if (window.createImageBitmap) {
      return createImageBitmap(f, { imageOrientation: "from-image" }).catch(function () { return viaImg(f); });
    }
    return viaImg(f);
  }
  function viaImg(f) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(f), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error("unreadable")); };
      im.src = u;
    });
  }
  function toBlob(cv, q) { return new Promise(function (r) { cv.toBlob(r, "image/jpeg", q); }); }
  function shrink(f) {
    return loadBitmap(f).then(function (bm) {
      var w = bm.width, h = bm.height, sc = Math.min(1, MAXDIM / Math.max(w, h));
      if (sc === 1 && f.size <= KEEP && /^image\/(jpeg|png)$/.test(f.type)) return { blob: f, name: f.name, resized: false };
      var cv = document.createElement("canvas");
      return (function attempt(scale, q) {
        cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
        var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bm, 0, 0, cv.width, cv.height);
        return toBlob(cv, q).then(function (b) {
          if (!b) throw new Error("unreadable");
          if (b.size > 1.8 * 1024 * 1024 && q > 0.55) return attempt(scale, q - 0.1);
          if (b.size > 1.8 * 1024 * 1024 && scale > 0.4) return attempt(scale * 0.75, 0.8);
          return { blob: b, name: f.name.replace(/\.[^.]+$/, "") + ".jpg", resized: true };
        });
      })(sc, 0.85);
    });
  }
  function toB64(blob) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(",")[1]); };
      fr.onerror = function () { rej(new Error("read")); };
      fr.readAsDataURL(blob);
    });
  }
  function readFile(inp) {
    var key = inp.getAttribute("data-key"), label = $("#" + inp.id + "Name"), f = inp.files[0];
    files[key] = null; label.textContent = ""; inp.closest(".field").classList.remove("invalid");
    var old = inp.closest(".field").querySelector(".msg"); if (old) old.remove();
    if (!f) return;
    var isImg = /^image\//.test(f.type), isPdf = f.type === "application/pdf";
    function reject(msg) { inp.value = ""; files[key] = null; label.textContent = ""; mark(inp, msg); }
    if (!isImg && !isPdf) return reject(bi("只接受相片或 PDF", "Only photos or PDF"));
    if (isPdf && f.size > MAXB) return reject(bi("PDF 超過 " + C.MAX_FILE_MB + "MB", "PDF is over " + C.MAX_FILE_MB + "MB"));
    if (isImg && f.size > 40 * 1024 * 1024) return reject(bi("相片過大", "Photo too large"));
    pending++; label.innerHTML = bi("處理中…", "Processing…");
    (isImg ? shrink(f) : Promise.resolve({ blob: f, name: f.name, resized: false }))
      .then(function (r) {
        if (r.blob.size > MAXB) throw new Error("big");
        return toB64(r.blob).then(function (b64) {
          files[key] = { name: r.name, type: r.blob.type, size: r.blob.size, data: b64 };
          label.textContent = "✓ " + r.name + " (" + Math.round(r.blob.size / 1024) + " KB";
          if (r.resized) { var rs = document.createElement("span"); rs.innerHTML = bi("，已自動縮小", ", resized"); label.appendChild(rs); }
          label.appendChild(document.createTextNode(")"));
        });
      })
      .catch(function (e) { reject(e.message === "big" ? bi("檔案仍超過 " + C.MAX_FILE_MB + "MB", "File is still over " + C.MAX_FILE_MB + "MB") : bi("無法讀取檔案，請改用 JPG／PNG", "Cannot read the file — try JPG/PNG")); })
      .then(function () { pending--; });
  }
  $$('input[type="file"]').forEach(function (i) { i.addEventListener("change", function () { readFile(i); }); });

  /* ---------- bot check (Cloudflare Turnstile) ---------- */
  var tsToken = "", tsId = null;
  function initTurnstile() {
    if (!C.TURNSTILE_SITEKEY) return;
    $("#tsWrap").hidden = false;
    if (tsId !== null) return;
    function render() {
      tsId = window.turnstile.render("#tsBox", {
        sitekey: C.TURNSTILE_SITEKEY,
        language: lang() === "hans" ? "zh-cn" : lang() === "en" ? "en" : "zh-tw",
        callback: function (t) { tsToken = t; hideError(); },
        "expired-callback": function () { tsToken = ""; },
        "error-callback": function () { tsToken = ""; }
      });
    }
    if (window.turnstile) return render();
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true;
    s.onload = render;
    s.onerror = function () { showError(bi("無法載入驗證，請重新整理。", "Could not load the human check — please refresh.")); };
    document.head.appendChild(s);
  }
  function resetTurnstile() { tsToken = ""; if (tsId !== null && window.turnstile) window.turnstile.reset(tsId); }

  /* ---------- data collection ---------- */
  function val(name) { var e = form.elements[name]; return e ? String(e.value || "").trim() : ""; }
  function checked(name) { return $$('input[name="' + name + '"]:checked').map(function (e) { return e.value; }); }
  function radioVal(name) { return (checked(name)[0]) || ""; }
  function withOther(sel, other, test) { var v = val(sel), o = val(other); return test(v) && o ? v + "：" + o : v; }
  function priorEducation() {   // one line per entry: institution | qualification | field | year
    var out = [];
    [1, 2].forEach(function (i) {
      if ($("#peRow" + i).hidden) return;
      var inst = val("pe" + i + "Inst"); if (!inst) return;
      out.push([inst, $("#pe" + i + "Level").value, val("pe" + i + "Field"), $("#pe" + i + "Year").value].join(" | "));
    });
    return out.join("\n");
  }
  function collect(ref) {
    var chat = [];
    if ($('input[name="whatsapp"]').checked) chat.push("WhatsApp");
    if ($('input[name="wechat"]').checked) chat.push("WeChat");
    var d = {
      ref: ref, submittedAt: new Date().toISOString(),
      cnName: val("cnName"), enName: val("enName"), gender: ($('input[name="gender"]:checked') || {}).value || "",
      dob: val("dob"), hkid: val("hkid").toUpperCase(), nationality: val("nationality"), ancestry: val("ancestry"),
      mobile: phoneFull("mobile", "mobile"), chatApps: chat.join(" / "), email: val("email"),
      address: val("address"),
      gradYear: val("gradYear"), college: withOther("college", "collegeOther", function (v) { return v === "其他"; }), major: val("major"), campus: val("campus"), eduLevel: val("eduLevel"),
      priorEducation: priorEducation(),
      district: withOther("district", "districtOther", function (v) { return /^香港以外/.test(v); }),
      workStatus: radioVal("workStatus"), industry: withOther("industry", "industryOther", function (v) { return /^其他/.test(v); }),
      mentor: radioVal("mentor"), interests: checked("interests"), roles: checked("roles"), cluster: radioVal("cluster"),
      referral: radioVal("referral"), comments: val("comments"),
      company: val("company"), position: val("position"), qualifications: val("qualifications"), publicService: val("publicService"),
      memberType: memberType() === "basic" ? "基本會員 Basic" : "學生會員 Student",
      fee: memberType() === "basic" ? C.FEE_BASIC : 0,
      payMethod: memberType() === "basic" ? (($('input[name="payMethod"]:checked') || {}).value || "") : "",
      consent: (($('input[name="consent"]:checked') || {}).value || "") + " [PICS " + PICS_VERSION + " " + lang() + "]",
      lang: lang(), turnstileToken: tsToken,
      signName: val("signName"), signDate: val("signDate"),
      userAgent: navigator.userAgent, website: val("website"), elapsedMs: Date.now() - openedAt,
      docFile: files.doc, payFile: $("#payProofWrap").hidden ? null : files.pay
    };
    return d;
  }

  // Splits a stored "中文 English" value into a displayable pair.
  function pair(v) {
    var m = /^(.*?[^\x00-\x7F])\s+([A-Za-z].*)$/.exec(v || "");
    return m ? { zh: m[1], en: m[2] } : { zh: v || "—", en: v || "—" };
  }
  function labelPair(input) {   // from the visible label markup of a checked radio
    var l = input && input.closest("label"); if (!l) return { zh: "—", en: "—" };
    var z = l.querySelector(".zh"), e = l.querySelector(".en");
    return { zh: z ? z.textContent.trim() : "—", en: e ? e.textContent.trim() : (z ? z.textContent.trim() : "—") };
  }
  function selPair(id, other, test) {
    var s = $("#" + id), o = s.options[s.selectedIndex]; if (!o || !s.value) return { zh: "—", en: "—" };
    var zh = o.getAttribute("data-zh") || o.textContent, en = o.getAttribute("data-en") || o.textContent, x = val(other);
    if (test(s.value) && x) { zh += "：" + x; en += ": " + x; }
    return { zh: zh, en: en };
  }
  function buildSummary() {
    var d = collect("—"), dl = $("#summary"), none = { zh: "—", en: "—" };
    var occ = [d.company, d.position].filter(Boolean).join(" · ");
    var ws = $('input[name="workStatus"]:checked');
    var rows = [
      ["姓名", "Name", d.cnName + " " + d.enName], ["性別", "Gender", pair(d.gender)], ["出生日期", "Date of birth", d.dob],
      ["手提電話", "Mobile", d.mobile + (d.chatApps ? " (" + d.chatApps + ")" : "")], ["電郵", "Email", d.email],
      ["居住區域", "District", selPair("district", "districtOther", function (v) { return /^香港以外/.test(v); })],
      ["住宅地址", "Address", d.address || "—"],
      ["畢業年份", "Graduation", d.gradYear || { zh: "在學", en: "Still studying" }],
      ["校區", "Campus", selPair("campus", "", function () { return false; })],
      ["學院", "College", selPair("college", "collegeOther", function (v) { return v === "其他"; })],
      ["專業", "Major", d.major || "—"],
      ["其他學歷", "Other education", d.priorEducation || "—"],
      ["職業", "Occupation", ws ? { zh: labelPair(ws).zh + (occ ? " · " + occ : ""), en: labelPair(ws).en + (occ ? " · " + occ : "") } : (occ || "—")],
      ["活動興趣", "Interests", { zh: "已選 " + d.interests.length + " 項", en: d.interests.length + " selected" }],
      ["會籍", "Membership", { zh: (memberType() === "basic" ? "基本會員" : "學生會員") + (d.fee ? "（HK$" + d.fee + "）" : "（免費）"), en: (memberType() === "basic" ? "Basic" : "Student") + (d.fee ? " (HK$" + d.fee + ")" : " (free)") }],
      ["繳費方式", "Payment", d.payMethod ? pair(d.payMethod) : none]
    ];
    dl.innerHTML = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      setBi(dt, r[0], r[1]);
      if (typeof r[2] === "object") setBi(dd, r[2].zh, r[2].en); else dd.textContent = r[2];
      dd.style.whiteSpace = "pre-line";
      dl.appendChild(dt); dl.appendChild(dd);
    });
  }

  function makeRef() {
    var t = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    var r = Math.floor(Math.random() * 9000 + 1000);
    return "JNU-" + t.getFullYear() + p(t.getMonth() + 1) + p(t.getDate()) + "-" + r;
  }

  /* ---------- submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(cur)) return;
    if (C.TURNSTILE_SITEKEY && !tsToken) { showError(bi("請先完成人機驗證。", "Please complete the human check first.")); return; }
    if (pending > 0) { showError(bi("檔案仍在讀取，請稍候再試。", "File still loading — please retry.")); return; }
    var ref = makeRef(), data = collect(ref);
    btnSubmit.disabled = true; btnBack.disabled = true;
    var orig = btnSubmit.innerHTML; btnSubmit.innerHTML = bi("提交中…", "Submitting…");

    send(data).then(function (j) {
      if (j && j.ref) data.ref = j.ref;   // server is the authority on the reference no.
      finish(data);
    }).catch(function (err) {
      console.error(err);
      btnSubmit.disabled = false; btnBack.disabled = false; btnSubmit.innerHTML = orig;
      resetTurnstile();
      showError(String(err && err.message) === "captcha"
        ? bi("人機驗證未通過，請重新驗證後再提交。", "Human check failed — please verify again and resubmit.")
        : bi("提交失敗，請檢查網絡後重試，或聯絡本會。", "Submission failed — please check your connection and retry, or contact the Association."));
    });
  });

  function send(data) {
    if (!C.ENDPOINT) { console.info("[DEMO] would submit:", data); return new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 600); }); }
    // text/plain avoids a CORS preflight (required by Apps Script; harmless for the Worker).
    return fetch(C.ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "server error"); return j; });
  }

  function finish(d) {
    $("#refNo").textContent = d.ref;
    var box = $("#doneNext"), basic = memberType() === "basic", pm = d.payMethod, f = C.FEE_BASIC, html = "";
    var fx = (C.CONTACT && C.CONTACT.fax) ? String(C.CONTACT.fax).replace(/[&<>"']/g, "") : "";
    var faxZh = fx ? "（傳真：" + fx + "）" : "", faxEn = fx ? " (fax: " + fx + ")" : "";
    function nx(zh, en) { return "<p><b>" + bi("下一步：", "Next:") + "</b> " + bi(zh, en) + "</p>"; }
    if (!basic) html = nx("本會審核你的學生身份後會以電郵通知。", "we will verify your student status and notify you by email.");
    else if (pm.indexOf("In person") > -1) html = nx("請親臨本會繳交會費 HK$" + f + " 並出示申請編號。", "pay HK$" + f + " in cash at the office, quoting your reference number.");
    else if (pm.indexOf("Cheque") > -1) html = nx("請將 HK$" + f + " 支票郵寄至本會，支票背頁註明申請人姓名。", "post a HK$" + f + " cheque to the Association, with the applicant's name written on the back.");
    else html = nx("請存入 HK$" + f + "，入數紙註明申請人姓名，傳真至校友會" + faxZh + "並確認收妥。", "deposit HK$" + f + ", write the applicant's name on the pay-in slip, fax it to the Association" + faxEn + " and confirm receipt.");
    box.innerHTML = html;
    form.hidden = true; $("#steps").hidden = true; $("#demoBanner").hidden = true;
    $("#done").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  show(0);
})();
