(function () {
  "use strict";
  var C = window.JNU_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var form = $("#form"), steps = $$(".step"), stepNav = $$("#steps li");
  var btnBack = $("#btnBack"), btnNext = $("#btnNext"), btnSubmit = $("#btnSubmit");
  var errBox = $("#formError");
  var cur = 0, openedAt = Date.now();
  var files = { doc: null, pay: null }, pending = 0;

  /* ---------- config → page ---------- */
  $("#orgZh").textContent = C.ORG_ZH || "";
  $("#orgEn").textContent = C.ORG_EN || "";
  if (C.LOGO) $("#logo").src = C.LOGO;
  $("#yr").textContent = new Date().getFullYear();
  $$(".mb").forEach(function (e) { e.textContent = C.MAX_FILE_MB; });
  $$(".feeNum").forEach(function (e) { e.textContent = C.FEE_BASIC; });
  $("#feeBasic").textContent = "HK$" + C.FEE_BASIC;
  if (!C.ENDPOINT) $("#demoBanner").hidden = false;
  if (C.CONTACT && C.CONTACT.website) $("#homeLink").href = "https://" + C.CONTACT.website.replace(/^https?:\/\//, "");

  function contactLine() {
    var c = C.CONTACT || {}, b = [];
    if (c.address) b.push("地址 Address：" + c.address);
    if (c.phone) b.push("電話 Tel：" + c.phone);
    if (c.whatsapp) b.push("WhatsApp：" + c.whatsapp);
    if (c.email) b.push("電郵 Email：" + c.email);
    return b.join("　|　");
  }
  var cl = contactLine();
  $("#picsContact").textContent = cl ? "聯絡本會 Contact: " + cl : "";
  $("#doneContact").textContent = cl ? "如有查詢，請聯絡我們 For enquiries: " + cl : "";

  function fillDl(id, rows) {
    var dl = $(id); dl.innerHTML = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0];
      if (r[1]) dd.textContent = r[1]; else { dd.textContent = "待公佈 To be confirmed"; dd.className = "tbc"; }
      dl.appendChild(dt); dl.appendChild(dd);
    });
  }
  var P = C.PAYMENT || {};
  fillDl("#payInPerson", [["地址 Address", P.officeAddress], ["辦公時間 Hours", P.officeHours]]);
  fillDl("#payCheque", [["抬頭 Payable to", P.chequePayableTo], ["郵寄地址 Mail to", P.officeAddress]]);
  fillDl("#payBank", [["戶名 Payee", P.payee], ["銀行 Bank", P.bank], ["帳號 Account", P.account], ["轉數快 FPS", P.fps]]);

  /* ---------- year selects / dates ---------- */
  var thisYear = new Date().getFullYear();
  function yearOptions(sel, from, to, blank) {
    var h = '<option value="">' + blank + "</option>";
    for (var y = to; y >= from; y--) h += "<option>" + y + "</option>";
    sel.innerHTML = h;
  }
  yearOptions($("#enrolYear"), 1906, thisYear, "— 年份 Year —");  // Jinan founded 1906
  yearOptions($("#gradYear"), 1906, thisYear + 8, "— 年份 Year —");
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
    if (n === steps.length - 1) buildSummary();
    var top = $(".title").getBoundingClientRect().top + window.pageYOffset - 8;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function showError(msg) { errBox.textContent = msg; errBox.hidden = false; }
  function hideError() { errBox.hidden = true; }

  function memberType() { var r = $('input[name="memberType"]:checked'); return r ? r.value : ""; }

  /* ---------- validation ---------- */
  function clearInvalid(scope) { $$(".invalid", scope).forEach(function (e) { e.classList.remove("invalid"); }); $$(".msg", scope).forEach(function (e) { e.remove(); }); }
  function mark(el, msg) {
    var f = el.closest(".field") || el.closest(".choice") || el.parentNode;
    f.classList.add("invalid");
    if (msg && !f.querySelector(".msg")) { var m = document.createElement("div"); m.className = "msg"; m.textContent = msg; f.appendChild(m); }
  }
  var MSG = "此欄必填 Required";

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
      if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { mark(el, "電郵格式不正確 Invalid email"); bad.push(el); }
      if (v && el.name === "mobile" && v.replace(/\D/g, "").length < 8) { mark(el, "電話號碼不正確 Invalid number"); bad.push(el); }
      if (v && el.name === "hkid" && !/^[A-Za-z]{1,2}\d{6}\(?[0-9Aa]\)?$/.test(v.replace(/\s/g, ""))) { mark(el, "格式例：A123456(7) e.g. A123456(7)"); bad.push(el); }
    });
    if (n === 1) {
      var e = +$("#enrolYear").value, g = +$("#gradYear").value;
      if (e && g && g < e) { mark($("#gradYear"), "畢業年份不可早於入學年份 Must not precede enrolment"); bad.push($("#gradYear")); }
    }
    if (n === 3) {
      if (memberType() === "basic" && !$('input[name="payMethod"]:checked')) {
        mark($('input[name="payMethod"]'), "請選擇繳費方式 Select a payment method"); bad.push($('input[name="payMethod"]'));
      }
      if (memberType() === "student" && !files.doc) {
        mark($("#docFile"), "學生會員請上傳學生證 Student card required"); bad.push($("#docFile"));
      }
    }
    if (bad.length) {
      showError("請檢查標示的欄位。 Please check the highlighted fields.");
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

  /* ---------- file handling ---------- */
  function readFile(inp) {
    var key = inp.getAttribute("data-key"), label = $("#" + inp.id + "Name"), f = inp.files[0];
    files[key] = null; label.textContent = ""; label.style.color = ""; inp.closest(".field").classList.remove("invalid");
    var old = inp.closest(".field").querySelector(".msg"); if (old) old.remove();
    if (!f) return;
    if (f.size > C.MAX_FILE_MB * 1024 * 1024) { inp.value = ""; mark(inp, "檔案超過 " + C.MAX_FILE_MB + "MB File too large"); return; }
    if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(f.type)) { inp.value = ""; mark(inp, "只接受 JPG／PNG／PDF Only JPG/PNG/PDF"); return; }
    var fr = new FileReader(); pending++;
    fr.onload = function () {
      pending--;
      files[key] = { name: f.name, type: f.type, size: f.size, data: String(fr.result).split(",")[1] };
      label.textContent = "✓ " + f.name + " (" + Math.round(f.size / 1024) + " KB)";
    };
    fr.readAsDataURL(f);
  }
  $$('input[type="file"]').forEach(function (i) { i.addEventListener("change", function () { readFile(i); }); });

  /* ---------- data collection ---------- */
  function val(name) { var e = form.elements[name]; return e ? String(e.value || "").trim() : ""; }
  function checked(name) { return $$('input[name="' + name + '"]:checked').map(function (e) { return e.value; }); }
  function radioVal(name) { return (checked(name)[0]) || ""; }
  function withOther(sel, other, test) { var v = val(sel), o = val(other); return test(v) && o ? v + "：" + o : v; }
  function collect(ref) {
    var chat = [];
    if ($('input[name="whatsapp"]').checked) chat.push("WhatsApp");
    if ($('input[name="wechat"]').checked) chat.push("WeChat");
    var d = {
      ref: ref, submittedAt: new Date().toISOString(),
      cnName: val("cnName"), enName: val("enName"), gender: ($('input[name="gender"]:checked') || {}).value || "",
      dob: val("dob"), hkid: val("hkid").toUpperCase(), nationality: val("nationality"), ancestry: val("ancestry"),
      mobile: val("mobile"), chatApps: chat.join(" / "), email: val("email"), homeTel: val("homeTel"), fax: val("fax"),
      address: val("address"), corrAddress: val("corrAddress"),
      enrolYear: val("enrolYear"), gradYear: val("gradYear"), college: withOther("college", "collegeOther", function (v) { return v === "其他"; }), major: val("major"), eduLevel: val("eduLevel"),
      district: withOther("district", "districtOther", function (v) { return /^香港以外/.test(v); }),
      workStatus: radioVal("workStatus"), industry: withOther("industry", "industryOther", function (v) { return /^其他/.test(v); }),
      mentor: radioVal("mentor"), interests: checked("interests"), roles: checked("roles"), cluster: radioVal("cluster"),
      referral: radioVal("referral"), comments: val("comments"),
      company: val("company"), position: val("position"), qualifications: val("qualifications"), publicService: val("publicService"),
      memberType: memberType() === "basic" ? "基本會員 Basic" : "學生會員 Student",
      fee: memberType() === "basic" ? C.FEE_BASIC : 0,
      payMethod: memberType() === "basic" ? (($('input[name="payMethod"]:checked') || {}).value || "") : "",
      consent: ($('input[name="consent"]:checked') || {}).value || "",
      signName: val("signName"), signDate: val("signDate"),
      userAgent: navigator.userAgent, website: val("website"), elapsedMs: Date.now() - openedAt,
      docFile: files.doc, payFile: $("#payProofWrap").hidden ? null : files.pay
    };
    return d;
  }

  function buildSummary() {
    var d = collect("—"), dl = $("#summary"), rows = [
      ["姓名 Name", d.cnName + " " + d.enName], ["性別 Gender", d.gender], ["出生日期 DOB", d.dob],
      ["電話 Mobile", d.mobile + (d.chatApps ? " (" + d.chatApps + ")" : "")], ["電郵 Email", d.email],
      ["住宅地址 Address", d.address], ["居住區域 District", d.district || "—"], ["入學／畢業 Years", d.enrolYear + " – " + (d.gradYear || "在學 current")],
      ["學院／專業 College / Major", d.college + " / " + d.major],
      ["職業 Occupation", [d.workStatus, d.company, d.position].filter(Boolean).join(" · ") || "—"],
      ["活動興趣 Interests", d.interests.length + " 項 selected"],
      ["會籍 Membership", d.memberType + (d.fee ? " (HK$" + d.fee + ")" : "")],
      ["繳費方式 Payment", d.payMethod || "—"]
    ];
    dl.innerHTML = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1]; dl.appendChild(dt); dl.appendChild(dd);
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
    if (pending > 0) { showError("檔案仍在讀取，請稍候再試。 File still loading, please retry."); return; }
    var ref = makeRef(), data = collect(ref);
    btnSubmit.disabled = true; btnBack.disabled = true;
    var orig = btnSubmit.innerHTML; btnSubmit.innerHTML = "提交中… <span>Submitting…</span>";

    send(data).then(function (j) {
      if (j && j.ref) data.ref = j.ref;   // server is the authority on the reference no.
      finish(data);
    }).catch(function (err) {
      console.error(err);
      btnSubmit.disabled = false; btnBack.disabled = false; btnSubmit.innerHTML = orig;
      showError("提交失敗，請檢查網絡後重試，或聯絡本會。 Submission failed — please check your connection and retry, or contact the Association.");
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
    var box = $("#doneNext"), basic = memberType() === "basic", pm = d.payMethod, html = "";
    if (!basic) html = "<p><b>下一步：</b>本會審核你的學生身份後會以電郵通知。<br><span class='en'>Next: we will verify your student status and notify you by email.</span></p>";
    else if (pm.indexOf("In person") > -1) html = "<p><b>下一步：</b>請親臨本會繳交會費 HK$" + C.FEE_BASIC + " 並出示申請編號。<br><span class='en'>Next: pay HK$" + C.FEE_BASIC + " in cash at the office, quoting your reference number.</span></p>";
    else if (pm.indexOf("Cheque") > -1) html = "<p><b>下一步：</b>請將 HK$" + C.FEE_BASIC + " 支票（背面註明申請編號）交予本會。<br><span class='en'>Next: send a HK$" + C.FEE_BASIC + " cheque with your reference number on the back.</span></p>";
    else html = "<p><b>下一步：</b>請轉賬 HK$" + C.FEE_BASIC + "，備註填寫申請編號" + (d.payFile ? "。" : "，並將轉賬截圖發送本會。") + "<br><span class='en'>Next: transfer HK$" + C.FEE_BASIC + " with your reference number in the remarks" + (d.payFile ? "." : " and send us the slip.") + "</span></p>";
    box.innerHTML = html;
    form.hidden = true; $("#steps").hidden = true; $("#demoBanner").hidden = true;
    $("#done").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  show(0);
})();
