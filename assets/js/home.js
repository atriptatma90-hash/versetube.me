/* Home: latest videos, shorts, wiki preview cards with live images. */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("home"); VT.Player.init(); VT.initDialog();
    var count = document.getElementById("navVideoCount");
    if (count) count.textContent = (window.VIDEOS || []).length;

    var vids = (window.VIDEOS || []).filter(function (v) { return !v.isShort; }).slice(0, 6);
    var grid = document.getElementById("homeVideos");
    if (grid) {
      grid.innerHTML = vids.map(function (v) {
        return '<div class="media-card" data-yt="' + VT.esc(v.id) + '">' +
          '<div class="card-art"><img src="' + VT.esc(v.thumb) + '" alt="" loading="lazy"></div>' +
          '<div class="card-body"><h3>' + VT.esc(v.title) + "</h3>" +
          '<div class="card-meta">' + VT.esc([v.views, v.ago].filter(Boolean).join(" · ")) + "</div></div></div>";
      }).join("");
      grid.querySelectorAll("[data-yt]").forEach(function (el) {
        el.addEventListener("click", function () { VT.Player.open(el.getAttribute("data-yt")); });
      });
    }
    var shorts = (window.VIDEOS || []).filter(function (v) { return v.isShort; }).slice(0, 8);
    var shelf = document.getElementById("homeShorts");
    if (shelf) {
      shelf.innerHTML = shorts.map(function (v) {
        return '<div class="short-card" data-yt="' + VT.esc(v.id) + '">' +
          '<div class="thumb"><img src="' + VT.esc(v.thumb) + '" alt="" loading="lazy"></div>' +
          '<div class="info"><div class="title">' + VT.esc(v.title) + "</div></div></div>";
      }).join("");
      shelf.querySelectorAll("[data-yt]").forEach(function (el) {
        el.addEventListener("click", function () { VT.Player.open(el.getAttribute("data-yt")); });
      });
    }
    // character preview: 6 cards, images loaded live from the wikis
    var chars = VT_DATA.CHARACTERS.filter(function (c, i) {
      return [0, 4, 8, 12, 13, 17].indexOf(i) > -1;
    });
    var cg = document.getElementById("homeChars");
    if (cg) {
      cg.innerHTML = chars.map(function (c, i) {
        return '<div class="media-card" data-char="' + i + '">' +
          '<div class="card-art portrait"><div class="letter-fallback">' + VT.esc(c.name.charAt(0)) + "</div></div>" +
          '<div class="card-body"><h3>' + VT.esc(c.name) + "</h3>" +
          '<div class="card-sub">' + VT.esc(c.blurb) + "</div>" +
          '<div class="card-meta"><span class="badge purple">' + VT.esc(c.series) + "</span></div></div></div>";
      }).join("");
      cg.querySelectorAll("[data-char]").forEach(function (el) {
        el.addEventListener("click", function () {
          location.href = "/characters.html#c=" + encodeURIComponent(chars[+el.getAttribute("data-char")].name);
        });
      });
      chars.forEach(function (c, i) {
        VT.fandomImage(c.wiki, c.page, 400).then(function (r) {
          if (!r.img) return;
          var card = cg.querySelector('[data-char="' + i + '"] .card-art');
          if (card) card.innerHTML = '<img src="' + VT.esc(r.img) + '" alt="" loading="lazy">';
        }).catch(function () {});
      });
    }
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && top.value.trim()) location.href = "/characters.html?q=" + encodeURIComponent(top.value.trim());
    });
  });
})();
