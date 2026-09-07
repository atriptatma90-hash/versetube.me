/* Videos library: type tabs, search, grid/list layout, player. */
(function () {
  "use strict";
  var mode = "videos", query = "";
  function render() {
    var list = (window.VIDEOS || []).filter(function (v) {
      var okType = mode === "all" ? true : mode === "videos" ? !v.isShort : !!v.isShort;
      var okQ = !query || (v.title || "").toLowerCase().indexOf(query) > -1;
      return okType && okQ;
    });
    var grid = document.getElementById("videoGrid");
    var n = document.getElementById("videoCount");
    if (n) n.textContent = list.length + " video" + (list.length === 1 ? "" : "s");
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state"><div class="big">📼</div><p>No videos match. Try another search.</p></div>';
      return;
    }
    grid.innerHTML = list.map(function (v) {
      return '<div class="media-card" data-yt="' + VT.esc(v.id) + '">' +
        '<div class="card-art"><img src="' + VT.esc(v.thumb) + '" alt="" loading="lazy">' +
        '<div class="card-badges">' + (v.isShort ? '<span class="badge gold">SHORT</span>' : "") + "</div></div>" +
        '<div class="card-body"><h3>' + VT.esc(v.title) + "</h3>" +
        '<div class="card-meta">' + VT.esc([v.views, v.ago].filter(Boolean).join(" · ")) + "</div></div></div>";
    }).join("");
    grid.querySelectorAll("[data-yt]").forEach(function (el) {
      el.addEventListener("click", function () { VT.Player.open(el.getAttribute("data-yt")); });
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("videos"); VT.Player.init(); VT.initDialog();
    var all = window.VIDEOS || [];
    var count = document.getElementById("navVideoCount");
    if (count) count.textContent = all.length;
    if (location.hash === "#shorts") mode = "shorts";
    document.querySelectorAll("#typeTabs button").forEach(function (b) {
      if (b.getAttribute("data-mode") === mode) b.classList.add("active");
      else b.classList.remove("active");
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mode");
        document.querySelectorAll("#typeTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
    });
    var s = document.getElementById("videoSearch");
    if (s) s.addEventListener("input", function () { query = s.value.trim().toLowerCase(); render(); });
    document.querySelectorAll("[data-layout]").forEach(function (b) {
      b.addEventListener("click", function () {
        var grid = document.getElementById("videoGrid");
        var list = b.getAttribute("data-layout") === "list";
        if (grid) grid.classList.toggle("list", list);
        document.querySelectorAll("[data-layout]").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
      });
    });
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && top.value.trim()) location.href = "/characters.html?q=" + encodeURIComponent(top.value.trim());
    });
    render();
  });
})();
