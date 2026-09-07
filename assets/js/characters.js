/* Characters: searchable index, live wiki portraits, tabbed detail
   (AniList bio + Fandom story summary + VerseTube videos). */
(function () {
  "use strict";
  var series = "all", query = "";
  function filtered() {
    return VT_DATA.CHARACTERS.map(function (c, i) { c._i = i; return c; }).filter(function (c) {
      var okS = series === "all" ? true : (series === "naruto" ? c.series === "Naruto" : c.series === "One Piece");
      var okQ = !query || c.name.toLowerCase().indexOf(query) > -1;
      return okS && okQ;
    });
  }
  function render() {
    var grid = document.getElementById("charGrid");
    if (!grid) return;
    var list = filtered();
    var n = document.getElementById("charCount");
    if (n) n.textContent = list.length + " characters";
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state"><div class="big">🥷</div><p>No character matches. Try the wiki search — it queries the live fandoms.</p></div>';
      return;
    }
    grid.innerHTML = list.map(function (c) {
      return '<div class="media-card" data-char="' + c._i + '">' +
        '<div class="card-art portrait"><div class="letter-fallback">' + VT.esc(c.name.charAt(0)) + "</div></div>" +
        '<div class="card-body"><h3>' + VT.esc(c.name) + "</h3>" +
        '<div class="card-sub">' + VT.esc(c.blurb) + "</div>" +
        '<div class="card-meta"><span class="badge purple">' + VT.esc(c.series) + "</span></div></div></div>";
    }).join("");
    grid.querySelectorAll("[data-char]").forEach(function (el) {
      el.addEventListener("click", function () { openChar(VT_DATA.CHARACTERS[+el.getAttribute("data-char")]); });
    });
    // live portraits, 3 at a time
    var queue = list.slice(), active = 0;
    function next() {
      if (!queue.length || active >= 3) return;
      var c = queue.shift(); active++;
      VT.fandomImage(c.wiki, c.page, 400).then(function (r) {
        if (r.img) {
          var art = grid.querySelector('[data-char="' + c._i + '"] .card-art');
          if (art) VT.setArt(art, r.img);
        }
      }).catch(function () {}).then(function () { active--; next(); });
      next();
    }
    next();
  }
  function stripAni(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html || "");
    var t = (d.textContent || "").replace(/__(.*?)__/g, "$1").trim();
    return t.length > 1200 ? t.slice(0, 1200).replace(/\s+\S*$/, "") + "…" : t;
  }
  function openChar(c) {
    VT.openDetail({
      eyebrow: c.series.toUpperCase() + " · CHARACTER", title: c.name, sub: c.blurb, img: null,
      facts: [["Series", c.series], ["Wiki", c.wiki + ".fandom.com"], ["Source", "Loading live…"]],
      tabs: [{ id: "ov", label: "Overview", html: '<div class="skel" style="height:140px"></div>' }],
      cached: false
    });
    var imgP = VT.fandomImage(c.wiki, c.page, 600).catch(function () { return { img: null }; });
    var bioP = VT.anilistCharacter(c.name).catch(function () { return { character: null, cached: true }; });
    var storyP = VT.fandomSummary(c.wiki, c.page, 1500).catch(function () { return { text: "", pageUrl: "" }; });
    Promise.all([imgP, bioP, storyP]).then(function (rs) {
      var img = rs[0].img, bio = rs[1].character, story = rs[2];
      var anyLive = !!(rs[0].img || bio || (story && story.text));
      if (!anyLive) VT.toast("Wiki offline — showing saved snapshot.");
      var rel = VT.relatedVideos([c.name].concat(c.keys || []), 5, [c.series]);
      var facts = [
        ["Series", c.series],
        ["Wiki", c.wiki + ".fandom.com"],
        ["Source", bio ? "AniList + Fandom" : (story.text ? "Fandom wiki" : "Saved snapshot")]
      ];
      var tabs = [
        { id: "ov", label: "Overview",
          html: '<div class="wiki-text">' + VT.esc(stripAni(bio && bio.description) || c.blurb) + "</div>" },
        { id: "st", label: "Story",
          html: story.text
            ? '<p class="src-note">Summary from the ' + VT.esc(c.series) + ' Wiki (CC-BY-SA) — trimmed.</p><div class="wiki-text">' + VT.esc(story.text) + "</div>"
            : "<p>Story summary is offline right now — open the full wiki article instead.</p>" },
        { id: "vd", label: "Videos (" + rel.length + ")",
          html: rel.length ? rel.map(VT.miniVideoHTML).join("") : "<p>No VerseTube video on " + VT.esc(c.name) + " yet.</p>" }
      ];
      VT.openDetail({
        eyebrow: c.series.toUpperCase() + " · CHARACTER", title: c.name, sub: c.blurb,
        img: img || (bio && bio.image ? bio.image.large : null),
        facts: facts, tabs: tabs,
        sourceUrl: (story && story.pageUrl) || (bio && bio.siteUrl),
        sourceLabel: "Full article on the " + c.series + " Wiki",
        cached: !anyLive
      });
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("characters"); VT.Player.init(); VT.initDialog();
    var m = /[?&#]q=([^&#]*)/.exec(location.search + location.hash);
    if (m) query = decodeURIComponent(m[1].replace(/\+/g, " ")).toLowerCase();
    var mc = /[?&#]c=([^&#]*)/.exec(location.search + location.hash);
    document.querySelectorAll("#seriesTabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        series = b.getAttribute("data-series");
        document.querySelectorAll("#seriesTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
    });
    var s = document.getElementById("charSearch");
    if (s) {
      if (query) s.value = query;
      s.addEventListener("input", function () { query = s.value.trim().toLowerCase(); render(); });
    }
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { query = top.value.trim().toLowerCase(); if (s) s.value = top.value.trim(); render(); }
    });
    var ws = document.getElementById("wikiSearch");
    if (ws) ws.addEventListener("click", function () { openWikiSearch(query || (s && s.value.trim()) || ""); });
    render();
    if (mc) {
      var name = decodeURIComponent(mc[1].replace(/\+/g, " "));
      var found = VT_DATA.CHARACTERS.filter(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })[0];
      if (found) openChar(found);
      else openWikiSearch(name);
    }
  });
  /* live cross-wiki search when the curated index has no match */
  function openWikiSearch(term) {
    if (!term) { VT.toast("Type a name to search the live wikis."); return; }
    VT.openDetail({
      eyebrow: "LIVE WIKI SEARCH", title: "“" + term + "”", sub: "Searching naruto.fandom.com + onepiece.fandom.com…",
      img: null, facts: [], tabs: [{ id: "r", label: "Results", html: '<div class="skel" style="height:120px"></div>' }],
      cached: false
    });
    Promise.all([VT.fandomSearch("naruto", term).catch(function () { return { titles: [] }; }),
                 VT.fandomSearch("onepiece", term).catch(function () { return { titles: [] }; })]).then(function (rs) {
      var rows = [];
      rs[0].titles.forEach(function (t) { rows.push({ wiki: "naruto", title: t }); });
      rs[1].titles.forEach(function (t) { rows.push({ wiki: "onepiece", title: t }); });
      var html = rows.length ? rows.slice(0, 10).map(function (r, i) {
        return '<div class="mini-video" data-wiki="' + r.wiki + '" data-title="' + VT.esc(r.title) + '">' +
          "<span><strong>" + VT.esc(r.title) + '</strong> <span class="src-note">' + r.wiki + ".fandom.com</span></span></div>";
      }).join("") : "<p>No wiki pages found. Check the spelling and try again.</p>";
      VT.openDetail({
        eyebrow: "LIVE WIKI SEARCH", title: "“" + term + "”", sub: rows.length + " page(s) found",
        img: null, facts: [["Naruto Wiki", rs[0].titles.length + " hit(s)"], ["One Piece Wiki", rs[1].titles.length + " hit(s)"]],
        tabs: [{ id: "r", label: "Results", html: html }], cached: false
      });
      document.querySelectorAll("#detailBody [data-wiki]").forEach(function (el) {
        el.addEventListener("click", function () {
          var w = el.getAttribute("data-wiki"), t = el.getAttribute("data-title");
          openChar({ name: t, series: w === "naruto" ? "Naruto" : "One Piece", wiki: w, page: t, keys: [t], blurb: "From " + w + ".fandom.com — live summary loading…" });
        });
      });
    });
  }
})();
