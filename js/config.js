/* ------------------------------------------------------------------
   Site configuration — edit this file only; no need to touch form.js

   TEXT values (names, addresses, bank name …) can be written three ways:
     "plain text"                                  → shown as-is in every language
     { hant: "繁體", hans: "简体", en: "English" } → one version per language
   If you leave hans empty it is converted automatically from hant.
   If you leave a language out it falls back to the others.
   Numbers (phone, fax, account no.) and e-mail are plain strings.
   ------------------------------------------------------------------ */
window.JNU_CONFIG = {
  // Receiver URL. Either the Cloudflare Worker  https://<worker-or-api-domain>/api/apply
  // (preferred, see ~/Claude/jinan/worker/README.md) or a Google Apps Script /exec URL.
  // Leave empty to run in DEMO mode (nothing is sent anywhere).
  ENDPOINT: "https://jnuhkaa-join-api.folliciahaircare.workers.dev/api/apply",

  // Cloudflare Turnstile site key (public). Leave empty to disable the human check.
  // The matching secret lives in the Worker (TURNSTILE_SECRET).
  TURNSTILE_SITEKEY: "",

  // Logo: replace assets/logo.svg, or point this at e.g. "assets/logo.png"
  LOGO: "assets/logo.svg",

  // Association name (header, footer, browser tab title)
  ORG: {
    hant: "暨南大學香港校友會",
    hans: "暨南大学香港校友会",
    en: "Jinan University Hong Kong Alumni Association"
  },

  FEE_BASIC: 100,            // HK$ — basic member
  MAX_FILE_MB: 5,

  // Contact shown on the success page and in the data statement. TODO: fill in.
  CONTACT: {
    address: { hant: "", hans: "", en: "" },
    phone: "", fax: "", whatsapp: "", email: "",
    website: "www.jnuhkaa.org"
  },

  // Payment details. TODO: fill in when received (never commit real account
  // numbers to a public repo — see README). Empty values show "to be confirmed".
  PAYMENT: {
    // 銀行入數 Bank deposit
    payee:   { hant: "", hans: "", en: "" },   // 存入戶口名稱 account name
    bank:    { hant: "", hans: "", en: "" },   // 銀行 bank
    account: "",                               // 帳號 account number
    fps: "",                                   // 轉數快 FPS id (optional)
    // 支票 Cheque
    chequePayableTo: { hant: "", hans: "", en: "" },   // 支票抬頭 payee on the cheque
    // 現金／郵寄 Cash in person & posting cheques
    officeAddress: { hant: "", hans: "", en: "" },
    officeHours:   { hant: "", hans: "", en: "" }
  }
};
