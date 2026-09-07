/* Sidebar "did you know" rotation. */
var VT_FACTS = [
  "Naruto's favorite ramen — miso chashu pork — is a real dish from Ichiraku's real-life inspiration in Fukuoka.",
  "One Piece has sold over 500 million manga volumes — the best-selling manga in history.",
  "Kakashi's face was hidden for 600+ chapters before finally being revealed in the manga.",
  "Gear 5's cartoon physics were inspired by classic Tex Avery and Tom & Jerry shorts.",
  "Itachi was 13 when he carried out the Uchiha clan massacre — 13.",
  "Zoro's 'nothing happened' scene is consistently voted the greatest One Piece moment.",
  "Tobirama Senju created the Shadow Clone, the Flying Raijin AND the Edo Tensei.",
  "Rocks D. Xebec's full story at God Valley is still one of One Piece's biggest mysteries."
];
(function () {
  "use strict";
  var i = 0;
  function show() {
    var el = document.getElementById("factLine");
    if (el) el.textContent = VT_FACTS[i % VT_FACTS.length];
    i++;
  }
  document.addEventListener("DOMContentLoaded", function () {
    show();
    setInterval(show, 12000);
  });
})();
