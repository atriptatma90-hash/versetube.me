/* Stories: story-arc index with live Fandom summaries + linked videos. */
(function () {
  "use strict";
  var series = "all", query = "";
  function filtered() {
    return VT_DATA.ARCS.map(function (a, i) { a._i = i; return a; }).filter(function (a) {
      var okS = series === "all" ? true : (series === "naruto" ? a.series === "Naruto" : a.series === "One Piece");
      var okQ = !query || a.title.toLowerCase().indexOf(query) > -1;
      return okS && okQ;
    });
  }
  function render() {
    var grid = document.getElementById("arcGrid");
    if (!grid) return;
    var list = filtered();
    var n = document.getElementById("arcCount");
    if (n) n.textContent = list.length + " stories";
    grid.innerHTML = list.map(function (a) {
      return '<div class="media-card" data-arc="' + a._i + '">' +
        '<div class="card-body"><h3>' + VT.esc(a.title) + "</h3>" +
        '<div class="card-sub">' + VT.esc(a.blurb) + "</div>" +
        '<div class="card-meta"><span class="badge purple">' + VT.esc(a.series) + "</span> · tap to read the full story</div></div></div>";
    }).join("");
    grid.querySelectorAll("[data-arc]").forEach(function (el) {
      el.addEventListener("click", function () { openArc(VT_DATA.ARCS[+el.getAttribute("data-arc")]); });
    });
  }
  function openArc(a) {
    VT.openDetail({
      eyebrow: a.series.toUpperCase() + " · STORY", title: a.title, sub: a.blurb, img: null,
      facts: [["Series", a.series], ["Wiki", a.wiki + ".fandom.com"], ["Source", "Loading live…"]],
      tabs: [{ id: "st", label: "Story", html: '<div class="skel" style="height:160px"></div>' }],
      cached: false
    });
    var imgP = VT.fandomImage(a.wiki, a.page, 800).catch(function () { return { img: null, pageUrl: "" }; });
    var sumP = VT.fandomSummary(a.wiki, a.page, 2200).catch(function () { return { text: "", pageUrl: "" }; });
    Promise.all([imgP, sumP]).then(function (rs) {
      var img = rs[0].img, sum = rs[1];
      var pageUrl = (sum && sum.pageUrl) || rs[0].pageUrl ||
        ("https://" + a.wiki + ".fandom.com/wiki/" + encodeURIComponent(a.page.replace(/ /g, "_")));
      if (!sum.text) VT.toast("Story text is offline — open the full wiki article instead.");
      var rel = VT.relatedVideos([a.title].concat(a.keys || []), 5);
      VT.openDetail({
        eyebrow: a.series.toUpperCase() + " · STORY", title: a.title, sub: a.blurb,
        img: img,
        facts: [["Series", a.series], ["Wiki", a.wiki + ".fandom.com"],
                ["Source", sum.text ? "Fandom wiki (CC-BY-SA, trimmed)" : "Saved snapshot"]],
        tabs: [
          { id: "st", label: "Story",
            html: sum.text
              ? '<div class="wiki-text">' + VT.esc(sum.text) + "</div>"
              : "<p>" + VT.esc(a.blurb) + "</p><p>Live text unavailable — the full article is one tap away.</p>" },
          { id: "vd", label: "Videos (" + rel.length + ")",
            html: rel.length ? rel.map(VT.miniVideoHTML).join("") : "<p>No VerseTube video on this arc yet.</p>" }
        ],
        sourceUrl: pageUrl, sourceLabel: "Full article on the " + a.series + " Wiki",
        cached: !sum.text
      });
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    VT.initTheme(); VT.initNav("stories"); VT.Player.init(); VT.initDialog();
    document.querySelectorAll("#seriesTabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        series = b.getAttribute("data-series");
        document.querySelectorAll("#seriesTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
    });
    var s = document.getElementById("arcSearch");
    if (s) s.addEventListener("input", function () { query = s.value.trim().toLowerCase(); render(); });
    var top = document.getElementById("topSearch");
    if (top) top.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && top.value.trim()) location.href = "/characters.html?q=" + encodeURIComponent(top.value.trim());
    });
    render();
  });
})();
