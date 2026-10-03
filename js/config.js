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
  TURNSTILE_SITEKEY: "0x4AAAAAAFMxOmvnCk0ahLAY",

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

  // Payment details. TODO: fill in when received. Empty values show "to be confirmed".
  // Never commit private account details to a public repo — see README.
  PAYMENT: {
    // 轉數快 FPS and 微信支付 WeChat Pay: put the QR images in assets/ (PNG/JPG) and set the paths.
    // Until a file exists the form shows a "QR code to be provided" placeholder.
    fpsQr: "assets/qr-fps.png",
    wechatQr: "assets/qr-wechat.png",
    fps: "",                                   // 轉數快 FPS ID / phone (optional, shown under the QR)
    // 銀行入數 Bank deposit (the pay-in slip is faxed to CONTACT.fax)
    payee:   { hant: "", hans: "", en: "" },   // 存入戶口名稱 account name (also shown under the QR codes)
    bank:    { hant: "", hans: "", en: "" },   // 銀行 bank
    account: ""                                // 帳號 account number
  }
};
