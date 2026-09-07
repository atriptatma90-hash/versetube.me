/* Anime index: live AniList cards + tabbed detail (Jikan backup, snapshot fallback). */
(function () {
  "use strict";
  var series = "all";
  function cardHTML(a, i) {
    return '<div class="media-card" data-anime="' + i + '">' +
      '<div class="card-art"><div class="letter-fallback">' + VT.esc(a.title.charAt(0)) + "</div></div>" +
      '<div class="card-body"><h3>' + VT.esc(a.title) + "</h3>" +
      '<div class="card-sub">' + VT.esc(a.blurb) + "</div>" +
      '<div class="card-meta">MAL #' + a.mal + " · tap for live info</div></div></div>";
  }
  function loadCovers(list, grid) {
    list.forEach(function (a, i) {
      VT.anilistAnime(a.search).then(function (r) {
        var m = r.anime;
        if (!m) return;
        var art = grid.querySelector('[data-anime="' + i + '"] .card-art');
        if (art && m.coverImage) {
          VT.setArt(art, m.coverImage.extraLarge || m.coverImage.large);
          if (m.averageScore) {
            var b = document.createElement("div");
            b.className = "card-badges";
            b.innerHTML = '<span class="badge gold">★ ' + m.averageScore + "</span>";
            art.appendChild(b);
          }
        }
      }).catch(function () {});
    });
  }
  function openAnime(a) {
    VT.openDetail({
      eyebrow: "ANIME · LIVE", title: a.title, sub: a.blurb, img: null,
      facts: [["MyAnimeList", "MAL #" + a.mal], ["Status", "Loading…"], ["Source", "AniList · Jikan · MAL"]],
      tabs: [{ id: "ov", label: "Overview", html: '<div class="skel" style="height:120px"></div>' }],
      cached: false
    });
    VT.anilistAnime(a.search).then(function (r) {
      if (!r.anime) throw new Error("not found");
      showAnime(a, r.anime, r.cached, "AniList");
    }).catch(function () {
      VT.jikan("/anime/" + a.mal + "/full").then(function (r) {
        var d = r.data.data || {};
        showAnime(a, {
          title: { english: d.title_english || d.title, romaji: d.title },
          coverImage: { large: (d.images || {}).jpg ? d.images.jpg.large_image_url : null },
          averageScore: d.score ? Math.round(d.score * 10) : null,
          episodes: d.episodes, status: d.status, format: d.type,
          genres: (d.genres || []).map(function (g) { return g.name; }),
          description: d.synopsis, siteUrl: d.url
        }, r.cached, "Jikan · MyAnimeList");
      }).catch(function () {
        VT.toast("Anime API offline — showing saved snapshot.");
        showAnime(a, null, true, "Saved snapshot");
      });
    });
  }
  function plain(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html || "");
    return (d.textContent || "").trim();
  }
  function showAnime(a, m, cached, src) {
    var keys = [a.title].concat(a.title.split(/[:\s]+/));
    var rel = VT.relatedVideos(keys, 4);
    var facts = [["MyAnimeList", "MAL #" + a.mal], ["Source", src]];
    var img = null, tabs;
    if (m) {
      img = m.coverImage ? (m.coverImage.extraLarge || m.coverImage.large) : null;
      facts = [
        ["Score", m.averageScore ? (m.averageScore / 10).toFixed(2) + " / 10" : "—"],
        ["Episodes", m.episodes || "—"],
        ["Status", String(m.status || "—").replace(/_/g, " ")],
        ["Format", m.format || "—"],
        ["Genres", (m.genres || []).slice(0, 4).join(", ") || "—"],
        ["Source", src]
      ];
      tabs = [
        { id: "ov", label: "Overview", html: '<div class="wiki-text">' + VT.esc(plain(m.description) || a.blurb) + "</div>" },
        { id: "vd", label: "VerseTube videos (" + rel.length + ")",
          html: rel.length ? rel.map(VT.miniVideoHTML).join("") : "<p>No VerseTube video on this yet — request one in the comments.</p>" }
      ];
    } else {
      tabs = [
        { id: "ov", label: "Overview", html: '<div class="wiki-text">' + VT.esc(a.blurb) + "</div>" },
        { id: "vd", label: "VerseTube videos (" + rel.length + ")",
          html: rel.length ? rel.map(VT.miniVideoHTML).join("") : "<p>No VerseTube video on this yet.</p>" }
      ];
    }
    VT.openDetail({
      eyebrow: "ANIME", title: (m && (m.title.english || m.title.romaji)) || a.title,
      sub: a.blurb, img: img, facts: facts, tabs: tabs,
      sourceUrl: m && m.siteUrl, sourceLabel: "Open on AniList",
      cached: cached
    });
  }
  function render() {
    var grid = document.getElementById("animeGrid");
    if (!grid) return;
    var list = VT_DATA.ANIME.filter(function (a) {
      if (series === "all") return true;
      return series === "naruto" ? a.key !== "onepiece" : a.key === "onepiece";
    });
    grid.innerHTML = list.map(cardHTML).join("");
    grid.querySelectorAll("[data-anime]").forEach(function (el) {
      el.addEventListener("click", function () { openAnime(list[+el.getAttribute("data-anime")]); });
    });
    loadCovers(list, grid);
    var n = document.getElementById("animeCount");
    if (n) n.textContent = list.length + " series";
  }
  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("anime"); VT.Player.init(); VT.initDialog();
    document.querySelectorAll("#seriesTabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        series = b.getAttribute("data-series");
        document.querySelectorAll("#seriesTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
    });
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && top.value.trim()) location.href = "/characters.html?q=" + encodeURIComponent(top.value.trim());
    });
    render();
  });
})();
