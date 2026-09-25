/* Anime database: featured / trending / popular / search (live AniList)
   + tabbed detail with synopsis, characters and VerseTube videos. */
(function () {
  "use strict";
  var mode = "featured", searchQ = "", searchTimer = null;

  function artHTML(letter) {
    return '<div class="card-art portrait"><div class="letter-fallback">' + VT.esc(letter) + "</div></div>";
  }
  function titleOf(m) {
    return (m.title && (m.title.english || m.title.romaji)) || "Untitled";
  }
  function cardHTML(m, i) {
    var meta = [];
    if (m.averageScore) meta.push("★ " + (m.averageScore / 10).toFixed(1));
    if (m.episodes) meta.push(m.episodes + " ep");
    if (m.format && m.format !== "TV") meta.push(m.format);
    return '<div class="media-card" data-media="' + i + '">' +
      artHTML(titleOf(m).charAt(0)) +
      '<div class="card-body"><h3>' + VT.esc(titleOf(m)) + "</h3>" +
      '<div class="card-sub">' + VT.esc((m.genres || []).slice(0, 3).join(" · ") || (m.status || "").replace(/_/g, " ").toLowerCase()) + "</div>" +
      '<div class="card-meta">' + VT.esc(meta.join(" · ") || "live file") + "</div></div></div>";
  }

  function showSkeleton(grid) {
    grid.innerHTML = ['3/4', '3/4', '3/4', '3/4'].map(function (r) {
      return '<div><div class="skel" style="aspect-ratio:' + r + '"></div><div class="skel" style="height:14px;margin:10px 0 6px;width:90%"></div></div>';
    }).join("");
  }

  function renderCards(grid, list) {
    grid.innerHTML = list.map(cardHTML).join("");
    grid.querySelectorAll("[data-media]").forEach(function (el) {
      el.addEventListener("click", function () { openMedia(list[+el.getAttribute("data-media")]); });
    });
    list.forEach(function (m, i) {
      var art = grid.querySelector('[data-media="' + i + '"] .card-art');
      var cover = m.coverImage && (m.coverImage.extraLarge || m.coverImage.large);
      if (art && cover) VT.setArt(art, cover, titleOf(m));
    });
    var n = document.getElementById("animeCount");
    if (n) n.textContent = list.length + (mode === "search" || mode === "trending" || mode === "popular" ? " results" : " series");
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state"><div class="big">🔍</div><p>No anime found. Try another title.</p></div>';
    }
  }

  function render() {
    var grid = document.getElementById("animeGrid");
    if (!grid) return;
    if (mode === "featured") {
      renderCards(grid, VT_DATA.ANIME || []);
      return;
    }
    showSkeleton(grid);
    var req;
    if (mode === "trending") req = VT.anilistBrowse({ sort: ["TRENDING_DESC"] });
    else if (mode === "popular") req = VT.anilistBrowse({ sort: ["POPULARITY_DESC"] });
    else {
      if (!searchQ) {
        grid.innerHTML = '<div class="empty-state"><div class="big">🔎</div><p>Type a title above — search the whole anime catalog live.</p></div>';
        document.getElementById("animeCount").textContent = "search";
        return;
      }
      req = VT.anilistBrowse({ sort: ["SEARCH_MATCH"], search: searchQ });
    }
    req.then(function (r) { renderCards(grid, r.list); })
      .catch(function () {
        VT.toast("AniList is offline right now — try again shortly.");
        if (mode !== "featured") grid.innerHTML = '<div class="empty-state"><div class="big">📴</div><p>Catalog offline. The featured shelf still works.</p></div>';
      });
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll("#seriesTabs button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-series") === m);
    });
    render();
  }

  /* ---------- detail dialog ---------- */
  function openMedia(m) {
    var title = titleOf(m);
    var rel = VT.relatedVideos([title].concat((m.title && m.title.romaji ? [m.title.romaji] : []) || []), 4);
    var cached = arguments[1] === true;
    VT.openDetail({
      eyebrow: "ANIME · LIVE", title: title, sub: (m.genres || []).join(" · "),
      img: m.coverImage && (m.coverImage.extraLarge || m.coverImage.large),
      facts: [
        ["Score", m.averageScore ? (m.averageScore / 10).toFixed(2) + " / 10" : "—"],
        ["Episodes", m.episodes || "—"],
        ["Status", String(m.status || "—").replace(/_/g, " ")],
        ["Format", m.format || "—"],
        ["Genres", (m.genres || []).slice(0, 4).join(", ") || "—"]
      ],
      tabs: [
        { id: "ov", label: "Overview", html: '<div class="wiki-text">' + VT.esc(plain(m.description) || "No synopsis yet — open the AniList page for details.").replace(/\n/g, "<br>") + "</div>" },
        { id: "ch", label: "Characters", html: '<div class="skel" style="height:140px"></div>' },
        { id: "vd", label: "Videos (" + rel.length + ")", html: rel.length ? rel.map(VT.miniVideoHTML).join("") : "<p>No VerseTube video on this yet — request one in the comments.</p>" }
      ],
      sourceUrl: m.siteUrl, sourceLabel: "Open on AniList", cached: cached
    });
    // live characters for the Characters tab (clicks delegated in openDetail)
    VT.anilistMediaCharacters(m.id).then(function (r) {
      if (!r.list.length) return;
      VT._detailChars = r.list;
      setTabHTML("ch", r.list.map(function (c, i) {
        var media = c.media && c.media.nodes && c.media.nodes[0];
        var img = (c.image && (c.image.large || c.image.medium)) || "";
        var nm = VT.charName(c);
        return '<div class="mini-video" data-charidx="' + i + '" role="button" tabindex="0">' +
          '<img src="' + VT.esc(img) + '" alt="' + VT.esc(nm) + '" loading="lazy" onerror="VT.thumbFail(this)">' +
          "<span><strong>" + VT.esc(nm) + '</strong> <span class="src-note">' + VT.esc(c.role || "") +
          (media ? " · " + VT.esc(media.title.romaji || "") : "") + "</span></span></div>";
      }).join(""));
    }).catch(function () {
      setTabHTML("ch", "<p>Character list offline right now — open the AniList page instead.</p>");
    });
  }

  function setTabHTML(id, html) {
    // only replace if that tab is currently visible OR stash for later click:
    // simplest — replace the matching button's stored html by re-opening is overkill;
    // tabs render into #detailBody on click, so store html in the tab element.
    var tabBar = document.getElementById("detailTabs");
    var buttons = tabBar ? tabBar.querySelectorAll("button") : [];
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i]._tabId === id) { buttons[i]._tabHTML = html; break; }
    }
    var active = tabBar && tabBar.querySelector('button[aria-selected="true"]');
    if (active && active._tabId === id) document.getElementById("detailBody").innerHTML = html;
  }

  function plain(html) {
    return VT.wikiText(html, 2400);
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("anime"); VT.Player.init(); VT.initDialog();
    document.querySelectorAll("#seriesTabs button").forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-series")); });
    });
    var s = document.getElementById("animeSearch");
    if (s) s.addEventListener("input", function () {
      searchQ = s.value.trim();
      if (searchQ && mode !== "search") setMode("search");
      clearTimeout(searchTimer);
      searchTimer = setTimeout(render, 420);
    });
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && top.value.trim()) location.href = "/characters.html?q=" + encodeURIComponent(top.value.trim());
    });
    render();

    // deep link: /anime.html?s=<id|title>
    var sm = /[?&]s=([^&#]*)/.exec(location.search);
    if (sm) {
      var want = decodeURIComponent(sm[1]);
      var hit = null;
      if (/^\d+$/.test(want)) {
        VT.anilistAnime(null, +want).then(function (r) { if (r.anime) openMedia(r.anime, r.cached); }).catch(function () {});
      } else {
        hit = (VT_DATA.ANIME || []).filter(function (a) {
          return String(a.search || a.title).toLowerCase() === want.toLowerCase() || a.title.toLowerCase() === want.toLowerCase();
        })[0];
        if (hit) setTimeout(function () { openCurated(hit); }, 300);
        else {
          VT.anilistBrowse({ sort: ["SEARCH_MATCH"], search: want }).then(function (r) {
            if (r.list.length) openMedia(r.list[0], r.cached);
          }).catch(function () {});
        }
      }
    }
  });

  /* curated entry (VT_DATA.ANIME has blurb/mal but no live data yet) */
  function openCurated(a) {
    VT.anilistAnime(a.search).then(function (r) {
      if (r.anime) openMedia(r.anime, r.cached);
      else throw new Error("nf");
    }).catch(function () {
      VT.toast("Anime API offline — showing saved snapshot.");
      VT.openDetail({
        eyebrow: "ANIME", title: a.title, sub: a.blurb, img: null,
        facts: [["MyAnimeList", "MAL #" + a.mal], ["Source", "Saved snapshot"]],
        tabs: [{ id: "ov", label: "Overview", html: '<div class="wiki-text">' + VT.esc(a.blurb) + "</div>" }],
        cached: true
      });
    });
  }
})();
