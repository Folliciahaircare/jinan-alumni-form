/* ------------------------------------------------------------------
   Site configuration — edit this file only; no need to touch form.js
   ------------------------------------------------------------------ */
window.JNU_CONFIG = {
  // Receiver URL. Either the Cloudflare Worker  https://<worker-or-api-domain>/api/apply
  // (preferred, see ~/Claude/jinan/worker/README.md) or a Google Apps Script /exec URL.
  // Leave empty to run in DEMO mode (nothing is sent anywhere).
  ENDPOINT: "https://jnuhkaa-join-api.folliciahaircare.workers.dev/api/apply",

  // Logo: replace assets/logo.svg, or point this at e.g. "assets/logo.png"
  LOGO: "assets/logo.svg",

  ORG_ZH: "暨南大學香港校友會",
  ORG_EN: "Jinan University Hong Kong Alumni Association",

  FEE_BASIC: 100,            // HK$ — basic member
  MAX_FILE_MB: 5,

  // Contact shown on the success page and in the declaration. TODO: fill in.
  CONTACT: { address: "", phone: "", whatsapp: "", email: "", website: "www.jnuhkaa.org" },

  // Payment details. TODO: fill in when received (never commit real account
  // numbers to a public repo — see README). Empty values show "to be confirmed".
  PAYMENT: {
    payee: "",
    bank: "",
    account: "",
    fps: "",
    chequePayableTo: "",
    officeAddress: "",
    officeHours: ""
  }
};
