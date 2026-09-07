/* VerseTube shared shell: themes, toast, cache, live-data clients
   (AniList primary, Jikan backup, Fandom wikis), detail dialog, cards. */
var VT = (function () {
  "use strict";

  /* ---------- themes (DownloadVerse-style data-theme switch) ---------- */
  var THEMES = ["verse", "ocean", "black", "white"];
  function getTheme() {
    try { return localStorage.getItem("vt-theme") || "verse"; } catch (e) { return "verse"; }
  }
  function setTheme(t) {
    if (THEMES.indexOf(t) < 0) t = "verse";
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("vt-theme", t); } catch (e) {}
    var sel = document.getElementById("theme");
    if (sel) sel.value = t;
  }
  function initTheme() {
    setTheme(getTheme());
    var sel = document.getElementById("theme");
    if (sel) sel.addEventListener("change", function () { setTheme(sel.value); });
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, ms || 4200);
  }

  /* ---------- cache (localStorage, TTL) ---------- */
  function cacheGet(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o.exp && Date.now() > o.exp) { localStorage.removeItem(key); return null; }
      return o.val;
    } catch (e) { return null; }
  }
  function cacheSet(key, val, ttlMs) {
    try {
      localStorage.setItem(key, JSON.stringify({ val: val, exp: Date.now() + (ttlMs || 864e5) }));
    } catch (e) {}
  }
  function fetchJSON(url, opts) {
    opts = opts || {};
    var key = "vt:" + (opts.cacheKey || url);
    var ttl = opts.ttl == null ? 864e5 : opts.ttl;
    if (!opts.noCache) {
      var hit = cacheGet(key);
      if (hit) return Promise.resolve({ data: hit, cached: true });
    }
    return fetch(url, opts.fetchOpts || {}).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (j) { cacheSet(key, j, ttl); return { data: j, cached: false }; });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Fandom wikis (MediaWiki API, CORS via origin=*) ---------- */
  // wiki: "naruto" | "onepiece" -> https://<wiki>.fandom.com/api.php
  function fandom(wiki, params, cacheKey) {
    var q = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    var url = "https://" + wiki + ".fandom.com/api.php?origin=*&format=json&" + q;
    return fetchJSON(url, { cacheKey: cacheKey || ("fandom:" + wiki + ":" + q) });
  }
  function fandomSearch(wiki, term, limit) {
    return fandom(wiki, { action: "query", list: "search", srsearch: term, srlimit: limit || 8, srnamespace: 0 },
      "fandom-search:" + wiki + ":" + term).then(function (r) {
      var out = ((r.data.query || {}).search || []).map(function (s) { return s.title; });
      return { titles: out, cached: r.cached };
    });
  }
  function fandomImage(wiki, title, size) {
    return fandom(wiki, { action: "query", prop: "pageimages", titles: title, pithumbsize: size || 600 },
      "fandom-img:" + wiki + ":" + title).then(function (r) {
      var pages = (r.data.query || {}).pages || {};
      var k = Object.keys(pages)[0];
      var p = k ? pages[k] : null;
      var thumb = p && p.thumbnail ? p.thumbnail.source : null;
      var pageUrl = "https://" + wiki + ".fandom.com/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
      return { img: thumb, pageUrl: pageUrl, cached: r.cached };
    });
  }
  /* Strip wikitext to a readable plain-text summary (first ~3 paras). */
  function wikitextSummary(wikitext, maxChars) {
    var t = String(wikitext || "");
    t = t.replace(/<!--[\s\S]*?-->/g, "");
    // {{Nihongo|English|kanji|romaji}} holds the readable title — keep it.
    t = t.replace(/\{\{[Nn]ihongo\|([^}|{\n]+)[^}]*\}\}/g, "$1");
    // File/Image/Category links carry no article text — drop them whole.
    t = t.replace(/\[\[(File|Image|Category|Special|Help|Template):[^\]]*\]\]/gi, " ");
    // Strip remaining templates iteratively (infoboxes nest).
    var prev;
    do { prev = t; t = t.replace(/\{\{[^{}]*\}\}/g, " "); } while (t !== prev);
    t = t.replace(/__[A-Z]+__/g, " ");
    t = t.replace(/<ref[^>]*>[\s\S]*?<\/ref\s*>/gi, " ").replace(/<ref[^/]*\/>/gi, " ");
    t = t.replace(/<\/?[a-z][^>]*>/gi, " ");
    t = t.replace(/\[\^[^\]]*\]/g, " ");
    var lines = t.split("\n"), paras = [], cur = "";
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i].trim();
      if (/^==[^=]/.test(ln) && paras.length) break; // stop at first section
      if (!ln || ln.charAt(0) === "|" || ln.charAt(0) === "!" || ln.charAt(0) === "}"
          || /^\{\|/.test(ln) || /^\|\+/.test(ln)) continue;
      ln = ln.replace(/\[\[([^|\]]*\|)?([^\]]+)\]\]/g, "$2");
      ln = ln.replace(/'{2,5}/g, "");
      if (!ln) continue;
      cur += (cur ? " " : "") + ln;
      if (/[.!?]"?$/.test(ln) && cur.length > 120) { paras.push(cur); cur = ""; if (paras.length >= 3) break; }
    }
    if (cur && paras.length < 3) paras.push(cur);
    var out = paras.join("\n\n").replace(/[ \t]{2,}/g, " ").trim();
    if (out.length > (maxChars || 1400)) out = out.slice(0, maxChars || 1400).replace(/\s+\S*$/, "") + "…";
    return out;
  }
  function fandomSummary(wiki, title, maxChars) {
    return fandom(wiki, { action: "parse", page: title, prop: "wikitext" },
      "fandom-wiki:" + wiki + ":" + title).then(function (r) {
      var wt = r.data.parse && r.data.parse.wikitext ? r.data.parse.wikitext["*"] : "";
      var pageUrl = "https://" + wiki + ".fandom.com/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
      return { text: wikitextSummary(wt, maxChars), pageUrl: pageUrl, cached: r.cached };
    });
  }

  /* ---------- AniList (primary anime/character API, no key, CORS open) ---------- */
  function anilist(query, variables, cacheKey) {
    var key = "vt:anilist:" + (cacheKey || (query + JSON.stringify(variables || {})));
    if (cacheKey !== null) {
      var hit = cacheGet(key);
      if (hit) return Promise.resolve({ data: hit, cached: true });
    }
    return fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (r) {
      if (!r.ok) throw new Error("AniList HTTP " + r.status);
      return r.json();
    }).then(function (j) {
      if (j.errors) throw new Error(j.errors[0].message);
      cacheSet(key, j.data, 7 * 864e5);
      return { data: j.data, cached: false };
    });
  }
  var ANIME_Q = "query ($s: String) { Media(search: $s, type: ANIME, sort: SEARCH_MATCH) {" +
    "id title { romaji english } coverImage { extraLarge large } bannerImage averageScore " +
    "episodes status format genres description(asHtml: false) siteUrl trailer { id site } } }";
  function anilistAnime(search) {
    return anilist(ANIME_Q, { s: search }, "anime:" + search.toLowerCase()).then(function (r) {
      return { anime: r.data.Media, cached: r.cached };
    });
  }
  var CHAR_Q = "query ($s: String) { Character(search: $s, sort: SEARCH_MATCH) {" +
    "id name { full } image { large } description(asHtml: false) siteUrl } }";
  function anilistCharacter(search) {
    return anilist(CHAR_Q, { s: search }, "char:" + search.toLowerCase()).then(function (r) {
      return { character: r.data.Character, cached: r.cached };
    });
  }

  /* ---------- Jikan (backup; strict rate limit: 3/s) ---------- */
  var jikanQueue = Promise.resolve();
  function jikan(path, cacheKey, retries) {
    function run() {
      return fetchJSON("https://api.jikan.moe/v4" + path, { cacheKey: "jikan:" + (cacheKey || path), ttl: 7 * 864e5 })
        .catch(function (err) {
          if ((retries || 0) < 2 && /HTTP (429|504|500)/.test(String(err && err.message))) {
            return new Promise(function (res) { setTimeout(res, 1500 * ((retries || 0) + 1)); })
              .then(function () { return jikan(path, cacheKey, (retries || 0) + 1); });
          }
          throw err;
        });
    }
    jikanQueue = jikanQueue.then(function () { return new Promise(function (res) { setTimeout(res, 450); }); });
    return jikanQueue.then(run);
  }
  /* ---------- videos linked to a topic (matches the channel's own titles) ---------- */
  function relatedVideos(keys, limit, fallbackKeys) {
    function scoreFor(ks) {
      var ksl = (ks || []).map(function (k) { return String(k).toLowerCase(); });
      return (window.VIDEOS || []).map(function (v) {
        var t = (v.title || "").toLowerCase(), score = 0;
        ksl.forEach(function (k) { if (k && t.indexOf(k) > -1) score += k.length > 5 ? 2 : 1; });
        return { v: v, score: score };
      }).filter(function (x) { return x.score > 0; });
    }
    var scored = scoreFor(keys);
    if (!scored.length && fallbackKeys) scored = scoreFor(fallbackKeys);
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit || 4).map(function (x) { return x.v; });
  }
  function miniVideoHTML(v) {
    return '<div class="mini-video" data-yt="' + esc(v.id) + '">' +
      '<img src="' + esc(v.thumb) + '" alt="" loading="lazy">' +
      "<span>" + esc(v.title) + "</span></div>";
  }
  function bindMiniVideos(root) {
    (root || document).querySelectorAll(".mini-video[data-yt]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (window.VTPlayer) window.VTPlayer.open(el.getAttribute("data-yt"));
      });
    });
  }

  /* Progressive art: the letter fallback stays visible until the live
     image actually loads (Fandom's CDN 403s hotlinks that send a
     Referer, so images load with no-referrer; failures keep the letter). */
  function setArt(container, url) {
    if (!container || !url) return;
    var im = new Image();
    im.alt = "";
    im.loading = "lazy";
    try { im.referrerPolicy = "no-referrer"; } catch (e) {}
    im.addEventListener("load", function () { container.appendChild(im); });
    im.src = url;
  }

  /* ---------- tabbed detail dialog (DownloadVerse-style) ---------- */
  function openDetail(o) {
    // o: {eyebrow, title, sub, img, facts[[k,v]], tabs:[{id,label,html}], sourceUrl, sourceLabel, cached}
    var dlg = document.getElementById("detailDialog");
    if (!dlg) return;
    document.getElementById("detailEyebrow").textContent = o.eyebrow || "";
    document.getElementById("detailTitle").textContent = o.title || "";
    document.getElementById("detailSub").textContent = o.sub || "";
    var art = document.getElementById("detailArt");
    art.innerHTML = '<div class="letter-fallback">' + esc((o.title || "?").charAt(0)) + "</div>";
    if (o.img) setArt(art, o.img);
    var facts = document.getElementById("detailFacts");
    facts.innerHTML = (o.facts || []).map(function (f) {
      return '<div class="fact"><span>' + esc(f[0]) + "</span><strong>" + esc(f[1]) + "</strong></div>";
    }).join("");
    var tabBar = document.getElementById("detailTabs");
    var body = document.getElementById("detailBody");
    tabBar.innerHTML = "";
    (o.tabs || []).forEach(function (t, i) {
      var b = document.createElement("button");
      b.textContent = t.label;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () {
        tabBar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
        b.setAttribute("aria-selected", "true");
        body.innerHTML = t.html;
        bindMiniVideos(body);
      });
      tabBar.appendChild(b);
    });
    body.innerHTML = o.tabs && o.tabs.length ? o.tabs[0].html : "";
    bindMiniVideos(body);
    var foot = document.getElementById("detailFoot");
    foot.innerHTML = (o.cached
      ? '<span class="badge cache">Saved snapshot</span>'
      : '<span class="badge live">Live</span>') +
      (o.sourceUrl ? ' <a href="' + esc(o.sourceUrl) + '" target="_blank" rel="noopener">' +
        esc(o.sourceLabel || "Read full article") + " ↗</a>" : "");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else { dlg.setAttribute("open", ""); }
  }
  function initDialog() {
    var dlg = document.getElementById("detailDialog");
    if (!dlg) return;
    var close = document.getElementById("detailClose");
    if (close) close.addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); });
    dlg.addEventListener("click", function (e) {
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        dlg.close ? dlg.close() : dlg.removeAttribute("open");
      }
    });
  }

  /* ---------- shared video player overlay ---------- */
  var Player = {
    open: function (id) {
      var ov = document.getElementById("playerOverlay");
      var wrap = document.getElementById("playerWrap");
      var btn = document.getElementById("watchOnYt");
      if (!ov || !wrap) return;
      wrap.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
      if (btn) btn.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
      ov.classList.add("show");
    },
    close: function () {
      var ov = document.getElementById("playerOverlay");
      var wrap = document.getElementById("playerWrap");
      if (ov) ov.classList.remove("show");
      if (wrap) wrap.innerHTML = "";
    },
    init: function () {
      var ov = document.getElementById("playerOverlay");
      if (!ov) return;
      var c = document.getElementById("playerClose");
      if (c) c.addEventListener("click", Player.close);
      ov.addEventListener("click", function (e) { if (e.target === ov) Player.close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") Player.close(); });
      window.VTPlayer = Player;
    }
  };

  /* ---------- nav active state + footer year ---------- */
  function initNav(page) {
    document.querySelectorAll(".navigation .nav-button").forEach(function (a) {
      if (a.getAttribute("data-page") === page) a.classList.add("active");
      else a.classList.remove("active");
    });
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
    var label = document.getElementById("crumbTitle");
    if (label && !label.textContent) label.textContent = page.charAt(0).toUpperCase() + page.slice(1);
  }

  return {
    THEMES: THEMES, getTheme: getTheme, setTheme: setTheme, initTheme: initTheme,
    toast: toast, cacheGet: cacheGet, cacheSet: cacheSet, fetchJSON: fetchJSON, esc: esc,
    fandom: fandom, fandomSearch: fandomSearch, fandomImage: fandomImage,
    wikitextSummary: wikitextSummary, fandomSummary: fandomSummary,
    anilist: anilist, anilistAnime: anilistAnime, anilistCharacter: anilistCharacter,
    jikan: jikan, relatedVideos: relatedVideos, miniVideoHTML: miniVideoHTML, bindMiniVideos: bindMiniVideos,
    openDetail: openDetail, initDialog: initDialog, Player: Player, initNav: initNav, setArt: setArt
  };
})();
