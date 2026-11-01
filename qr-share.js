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
})();
