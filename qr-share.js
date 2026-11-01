/* "QR" button in the page footer: shows a QR code of the current page so it can be opened or shared from a phone. */
(function () {
  var MAP = { "": "index", "index": "index", "imastun": "imastun", "silva-gulanyan": "silva-gulanyan", "go-hara": "go-hara", "shakespeare": "shakespeare", "haj-poetner": "haj-poetner" };
  var path = location.pathname.replace(/\/+$/, "").split("/").pop().replace(/\.html$/, "");
  var slug = MAP[path];
  if (!slug) return;
  var TEXT = {
    hy: { btn: "QR կոդ", title: "Սկանավորիր հեռախոսով", save: "Բեռնել PNG", close: "Փակել" },
    ru: { btn: "QR-код", title: "Отсканируйте телефоном", save: "Скачать PNG", close: "Закрыть" },
    en: { btn: "QR code", title: "Scan with your phone", save: "Download PNG", close: "Close" }
  };
  function t() { var l = document.documentElement.lang; return TEXT[l] || TEXT.hy; }

  var style = document.createElement("style");
  style.textContent =
    ".qr-open{margin-left:12px;padding:3px 10px;border:1px solid rgba(201,168,76,.45);background:transparent;color:inherit;font:inherit;letter-spacing:inherit;cursor:pointer;border-radius:0}" +
    ".qr-open:hover,.qr-open:focus-visible{background:rgba(201,168,76,.14);outline:none}" +
    ".qr-dialog{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:16px}" +
    ".qr-dialog.open{display:flex}" +
    ".qr-box{background:#14110c;border:1px solid rgba(201,168,76,.6);padding:22px;max-width:340px;width:100%;text-align:center;color:#ecdfc6;font-family:inherit}" +
    ".qr-box h2{margin:0 0 14px;font-size:16px;font-weight:600;letter-spacing:.04em}" +
    ".qr-box img{display:block;width:100%;max-width:260px;height:auto;margin:0 auto 14px;background:#fff}" +
    ".qr-brand{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0;border:1px solid rgba(201,168,76,.55);background:transparent;color:#c9a84c;cursor:pointer;border-radius:0;flex:0 0 auto}" +
    ".qr-brand:hover,.qr-brand:focus-visible{background:rgba(201,168,76,.16);outline:none}" +
    ".brand-wrap{display:flex;align-items:center;justify-content:center;gap:10px;justify-self:center}" +
    "#nav .qr-brand{margin-left:-4px}" +
    "@media(max-width:600px){#nav .qr-brand{display:none}}" +
    "@media(max-width:700px){.brand-wrap .qr-brand{display:none}}" +
    ".qr-box a,.qr-box button{display:inline-block;margin:4px 6px 0;padding:8px 14px;border:1px solid rgba(201,168,76,.6);background:transparent;color:#e0b866;font:inherit;font-size:13px;text-decoration:none;cursor:pointer;border-radius:0}" +
    ".qr-box a:hover,.qr-box button:hover{background:rgba(201,168,76,.14)}";
  document.head.appendChild(style);

  var dialog = document.createElement("div");
  dialog.className = "qr-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.innerHTML = '<div class="qr-box"><h2></h2><img alt="QR" width="260" height="260"><div><a download></a><button type="button"></button></div></div>';
  document.body.appendChild(dialog);
  var h2 = dialog.querySelector("h2"), img = dialog.querySelector("img"), save = dialog.querySelector("a"), closeBtn = dialog.querySelector("button");
  img.src = "qr/" + slug + ".svg";
  save.href = "qr/" + slug + ".png";
  save.setAttribute("download", "imastun-" + slug + "-qr.png");

  var opener = document.createElement("button");
  opener.type = "button";
  opener.className = "qr-open";
  function refresh() { var x = t(); opener.textContent = x.btn; h2.textContent = x.title; save.textContent = x.save; closeBtn.textContent = x.close; }
  refresh();
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  function open() { dialog.classList.add("open"); closeBtn.focus(); }
  function close() { dialog.classList.remove("open"); opener.focus(); }
  opener.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && dialog.classList.contains("open")) close(); });

  var footer = document.querySelector("footer");
  if (footer) footer.appendChild(opener);

  // QR icon next to the "Imastun Studio" brand in the header (wide screens; on phones the footer button is used)
  var icon = document.createElement("button");
  icon.type = "button";
  icon.className = "qr-brand";
  icon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v0M17 20h4M20 17v3"/></svg>';
  function labelIcon() { var x = t(); icon.setAttribute("aria-label", x.btn); icon.setAttribute("title", x.btn); }
  labelIcon();
  new MutationObserver(labelIcon).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  icon.addEventListener("click", open);
  var navHome = document.querySelector("#nav .nav-home");
  var brand = document.querySelector(".topbar .brand");
  if (navHome) {
    navHome.insertAdjacentElement("afterend", icon);
  } else if (brand) {
    var wrap = document.createElement("div");
    wrap.className = "brand-wrap";
    brand.parentNode.insertBefore(wrap, brand);
    wrap.appendChild(brand);
    wrap.appendChild(icon);
  }
})();
