/* Home: anime wiki first (index, characters, arcs, wallpapers), videos last. */
(function () {
  "use strict";

  function bindCards(root, selector, handler) {
    root.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener("click", handler);
    });
  }

  /* --- Trending anime: live AniList (all series), curated fallback --- */
  function renderAnime() {
    var grid = document.getElementById("homeAnime");
    if (!grid) return;
    function paint(list, linkFn) {
      grid.innerHTML = list.map(function (a, i) {
        var cover = a.coverImage && (a.coverImage.extraLarge || a.coverImage.large);
        var t = a.title ? (a.title.english || a.title.romaji) : a.title;
        var meta = a.mal != null ? "MAL #" + a.mal
          : (a.averageScore ? "★ " + (a.averageScore / 10).toFixed(1) : "") +
            (a.episodes ? (a.mal != null || a.averageScore ? " · " : "") + a.episodes + " ep" : "");
        return '<div class="media-card" data-anime="' + i + '">' +
          '<div class="card-art portrait"><div class="letter-fallback">' + VT.esc(String(t).charAt(0)) + "</div></div>" +
          '<div class="card-body"><h3>' + VT.esc(t) + "</h3>" +
          '<div class="card-sub">' + VT.esc(a.blurb || (a.genres || []).slice(0, 3).join(" · ") || "Live anime file") + "</div>" +
          '<div class="card-meta">' + VT.esc(meta || "tap for live info") + "</div></div></div>";
      }).join("");
      grid.querySelectorAll("[data-anime]").forEach(function (el) {
        el.addEventListener("click", function () { linkFn(list[+el.getAttribute("data-anime")]); });
      });
      list.forEach(function (a, i) {
        var art = grid.querySelector('[data-anime="' + i + '"] .card-art');
        if (!art) return;
        if (a.coverImage) {
          var cover = a.coverImage.extraLarge || a.coverImage.large;
          if (cover) {
            VT.setArt(art, cover, a.title && (a.title.english || a.title.romaji));
            if (a.averageScore) {
              var b = document.createElement("div");
              b.className = "card-badges";
              b.innerHTML = '<span class="badge gold">★ ' + a.averageScore + "</span>";
              art.appendChild(b);
            }
            return;
          }
        }
        VT.anilistAnime(a.search).then(function (r) {
          if (!r.anime || !r.anime.coverImage) return;
          VT.setArt(art, r.anime.coverImage.extraLarge || r.anime.coverImage.large, a.title);
          if (r.anime.averageScore) {
            var b = document.createElement("div");
            b.className = "card-badges";
            b.innerHTML = '<span class="badge gold">★ ' + r.anime.averageScore + "</span>";
            art.appendChild(b);
          }
        }).catch(function () {});
      });
    }
    VT.anilistBrowse({ sort: ["TRENDING_DESC"] }).then(function (r) {
      if (!r.list.length) throw new Error("empty");
      paint(r.list.slice(0, 8), function (m) { location.href = "/anime.html?s=" + m.id; });
    }).catch(function () {
      var list = (VT_DATA.ANIME || []).slice(0, 4);
      paint(list, function (a) { location.href = "/anime.html?s=" + encodeURIComponent(a.search || a.title); });
    });
  }

  /* --- Character preview: 6 cards, live wiki images --- */
  function renderChars() {
    var chars = (VT_DATA.CHARACTERS || []).filter(function (c, i) {
      return [0, 4, 8, 12, 13, 17].indexOf(i) > -1;
    });
    var cg = document.getElementById("homeChars");
    if (!cg) return;
    cg.innerHTML = chars.map(function (c, i) {
      return '<div class="media-card" data-char="' + i + '">' +
        '<div class="card-art portrait"><div class="letter-fallback">' + VT.esc(c.name.charAt(0)) + "</div></div>" +
        '<div class="card-body"><h3>' + VT.esc(c.name) + "</h3>" +
        '<div class="card-sub">' + VT.esc(c.blurb) + "</div>" +
        '<div class="card-meta"><span class="badge purple">' + VT.esc(c.series) + "</span></div></div></div>";
    }).join("");
    bindCards(cg, "[data-char]", function (e) {
      var el = e.currentTarget;
      location.href = "/characters.html#c=" + encodeURIComponent(chars[+el.getAttribute("data-char")].name);
    });
    chars.forEach(function (c, i) {
      VT.fandomImage(c.wiki, c.page, 400).then(function (r) {
        if (!r.img) return;
        var card = cg.querySelector('[data-char="' + i + '"] .card-art');
        if (card) VT.setArt(card, r.img, c.name);
      }).catch(function () {});
    });
  }

  /* --- Story arcs preview --- */
  function renderArcs() {
    var grid = document.getElementById("homeArcs");
    if (!grid) return;
    var picks = [0, 4, 6, 10];
    var arcs = picks.map(function (i) { return VT_DATA.ARCS[i]; }).filter(Boolean);
    grid.innerHTML = arcs.map(function (a, i) {
      return '<div class="media-card" data-arc="' + i + '">' +
        '<div class="card-body"><h3>' + VT.esc(a.title) + "</h3>" +
        '<div class="card-sub">' + VT.esc(a.blurb) + "</div>" +
        '<div class="card-meta"><span class="badge purple">' + VT.esc(a.series) + "</span> · tap to read the full story</div></div></div>";
    }).join("");
    bindCards(grid, "[data-arc]", function () { location.href = "/stories.html"; });
  }

  /* --- 4K wallpapers promo strip (via vt-proxy, 5-min cache) --- */
  function renderWalls() {
    var shelf = document.getElementById("homeWalls");
    if (!shelf) return;
    var VAULT = "https://coc-image-vault.vercel.app";
    var PROXY = "https://vt-proxy-xi.vercel.app/api/proxy?url=" + encodeURIComponent(VAULT + "/api/list");
    VT.fetchJSON(PROXY, { cacheKey: "walls", ttl: 5 * 60e3 }).then(function (r) {
      var files = ((r.data || {}).files || []).filter(function (f) { return (f.section || "main") === "main"; }).slice(0, 10);
      shelf.innerHTML = files.map(function (f) {
        var thumb = VAULT + "/thumbs/640/" + encodeURIComponent(f.name) + ".webp";
        var nm = f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
        return '<a class="short-card" href="/wallpapers.html" style="text-decoration:none;color:inherit" aria-label="4K wallpaper: ' + VT.esc(nm) + '">' +
          '<div class="thumb"><img src="' + VT.esc(thumb) + '" alt="4K anime wallpaper — ' + VT.esc(nm) + '" loading="lazy"></div></a>';
      }).join("");
    }).catch(function () { shelf.innerHTML = '<p>Wallpaper gallery offline right now — <a href="/wallpapers.html">open the full gallery</a>.</p>'; });
  }

  /* --- Videos (secondary, last) --- */
  function renderVideos() {
    var count = document.getElementById("navVideoCount");
    if (count) count.textContent = (window.VIDEOS || []).length;

    var vids = (window.VIDEOS || []).filter(function (v) { return !v.isShort; }).slice(0, 6);
    var grid = document.getElementById("homeVideos");
    if (grid) {
      grid.innerHTML = vids.map(function (v) {
        return '<div class="media-card" data-yt="' + VT.esc(v.id) + '">' +
          '<div class="card-art"><img src="' + VT.esc(v.thumb) + '" alt="' + VT.esc(v.title) + '" loading="lazy" onerror="VT.thumbFail(this)"></div>' +
          '<div class="card-body"><h3>' + VT.esc(v.title) + "</h3>" +
          '<div class="card-meta">' + VT.esc([v.views, v.ago].filter(Boolean).join(" · ")) + "</div></div></div>";
      }).join("");
      bindCards(grid, "[data-yt]", function (e) { VT.Player.open(e.currentTarget.getAttribute("data-yt")); });
    }
    var shorts = (window.VIDEOS || []).filter(function (v) { return v.isShort; }).slice(0, 8);
    var shelf = document.getElementById("homeShorts");
    if (shelf) {
      shelf.innerHTML = shorts.map(function (v) {
        return '<div class="short-card" data-yt="' + VT.esc(v.id) + '">' +
          '<div class="thumb"><img src="' + VT.esc(v.thumb) + '" alt="' + VT.esc(v.title) + '" loading="lazy" onerror="VT.thumbFail(this)"></div>' +
          '<div class="info"><div class="title">' + VT.esc(v.title) + "</div></div></div>";
      }).join("");
      bindCards(shelf, "[data-yt]", function (e) { VT.Player.open(e.currentTarget.getAttribute("data-yt")); });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("home"); VT.Player.init(); VT.initDialog();
    renderAnime();
    renderChars();
    renderArcs();
    renderWalls();
    renderVideos();
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && top.value.trim()) location.href = "/characters.html?q=" + encodeURIComponent(top.value.trim());
    });
  });
})();
