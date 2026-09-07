/* VerseTube curated index: Naruto + One Piece launch scope.
   Page titles are Fandom canonical titles; images load LIVE from the
   wikis/AniList at runtime (never hardcoded — no rot). Blurbs are
   short original teasers; full text is fetched live with attribution. */
var VT_DATA = (function () {
  "use strict";
  var ANIME = [
    { key: "naruto", title: "Naruto", mal: 20, search: "Naruto", wiki: null,
      blurb: "A loud ninja with a sealed fox demon inside him chases recognition — and the title of Hokage." },
    { key: "shippuden", title: "Naruto Shippuden", mal: 173, search: "Naruto Shippuden", wiki: null,
      blurb: "Two years later: Akatsuki hunts the tailed beasts and Naruto fights to bring Sasuke home." },
    { key: "boruto", title: "Boruto: Naruto Next Generations", mal: 34566, search: "Boruto Naruto Next Generations", wiki: null,
      blurb: "Naruto's son Boruto clashes with his father's legacy while a new alien threat rises." },
    { key: "onepiece", title: "One Piece", mal: 21, search: "One Piece", wiki: null,
      blurb: "Monkey D. Luffy sails the Grand Line with his crew to find the One Piece and become Pirate King." }
  ];
  // wiki: "naruto" | "onepiece" (subdomain *.fandom.com), page: canonical page title
  var CHARACTERS = [
    { name: "Naruto Uzumaki", series: "Naruto", wiki: "naruto", page: "Naruto Uzumaki", keys: ["naruto"], blurb: "Jinchuriki of Kurama. Seventh Hokage. Never gives up — that's his ninja way." },
    { name: "Sasuke Uchiha", series: "Naruto", wiki: "naruto", page: "Sasuke Uchiha", keys: ["sasuke"], blurb: "Last loyal Uchiha. Chidori prodigy torn between revenge and his bond with Naruto." },
    { name: "Sakura Haruno", series: "Naruto", wiki: "naruto", page: "Sakura Haruno", keys: ["sakura"], blurb: "Tsunade's apprentice. Monster strength plus elite medical ninjutsu." },
    { name: "Kakashi Hatake", series: "Naruto", wiki: "naruto", page: "Kakashi Hatake", keys: ["kakashi"], blurb: "The Copy Ninja. Sharingan, Kamui, and a habit of being late." },
    { name: "Itachi Uchiha", series: "Naruto", wiki: "naruto", page: "Itachi Uchiha", keys: ["itachi"], blurb: "The truth behind the Uchiha massacre. Tsukuyomi, Amaterasu, Susanoo." },
    { name: "Madara Uchiha", series: "Naruto", wiki: "naruto", page: "Madara Uchiha", keys: ["madara"], blurb: "Legendary founder of Konoha who returned to cast Infinite Tsukuyomi." },
    { name: "Jiraiya", series: "Naruto", wiki: "naruto", page: "Jiraiya", keys: ["jiraiya"], blurb: "Toad Sage, godfather, and author. His Pain fight is legendary." },
    { name: "Orochimaru", series: "Naruto", wiki: "naruto", page: "Orochimaru", keys: ["orochimaru"], blurb: "The snake Sannin. Immortality seeker, curse marks, Edo Tensei." },
    { name: "Minato Namikaze", series: "Naruto", wiki: "naruto", page: "Minato Namikaze", keys: ["minato"], blurb: "The Yellow Flash. Flying Raijin, Rasengan's creator, Fourth Hokage." },
    { name: "Tobirama Senju", series: "Naruto", wiki: "naruto", page: "Tobirama Senju", keys: ["tobirama"], blurb: "Second Hokage. Created Shadow Clones, Edo Tensei, and the Anbu." },
    { name: "Pain (Nagato)", series: "Naruto", wiki: "naruto", page: "Nagato", keys: ["pain", "nagato"], blurb: "Rinnegan wielder who flattened Konoha asking one question: do you hate me?" },
    { name: "Obito Uchiha", series: "Naruto", wiki: "naruto", page: "Obito Uchiha", keys: ["obito", "tobi"], blurb: "Kamui's ghost. The masked man behind the Akatsuki and the war." },
    { name: "Monkey D. Luffy", series: "One Piece", wiki: "onepiece", page: "Monkey D. Luffy", keys: ["luffy"], blurb: "Rubber captain with a straw hat. Gear 5 turned him into Joy Boy himself." },
    { name: "Roronoa Zoro", series: "One Piece", wiki: "onepiece", page: "Roronoa Zoro", keys: ["zoro"], blurb: "Three-sword swordsman chasing the World's Strongest title for Kuina." },
    { name: "Nami", series: "One Piece", wiki: "onepiece", page: "Nami", keys: ["nami"], blurb: "Cat Burglar navigator mapping the whole world, one island at a time." },
    { name: "Sanji", series: "One Piece", wiki: "onepiece", page: "Sanji", keys: ["sanji"], blurb: "Black Leg cook. Never hits a woman, never misses a kick." },
    { name: "Shanks", series: "One Piece", wiki: "onepiece", page: "Shanks", keys: ["shanks"], blurb: "Red-Haired Emperor. Bet his arm on the new era — on Luffy." },
    { name: "Marshall D. Teach", series: "One Piece", wiki: "onepiece", page: "Marshall D. Teach", keys: ["blackbeard", "teach"], blurb: "Two Devil Fruits. Zero honor. The man racing Luffy to the One Piece." },
    { name: "Kaidou", series: "One Piece", wiki: "onepiece", page: "Kaido", keys: ["kaido", "kaidou"], blurb: "The Strongest Creature. An Emperor who fell in the raid on Onigashima." },
    { name: "Trafalgar D. Water Law", series: "One Piece", wiki: "onepiece", page: "Trafalgar D. Water Law", keys: ["law", "trafalgar"], blurb: "Surgeon of Death. The Ope Ope no Mi and the alliance that toppled Kaido." },
    { name: "Portgas D. Ace", series: "One Piece", wiki: "onepiece", page: "Portgas D. Ace", keys: ["ace"], blurb: "Fire Fist. His death at Marineford broke — and forged — Luffy." },
    { name: "Edward Newgate", series: "One Piece", wiki: "onepiece", page: "Edward Newgate", keys: ["whitebeard", "newgate"], blurb: "The Strongest Man. Died standing at Marineford declaring the One Piece is real." },
    { name: "Rocks D. Xebec", series: "One Piece", wiki: "onepiece", page: "Rocks D. Xebec", keys: ["xebec", "rocks"], blurb: "The forbidden pirate. God Valley is where Roger and Garp had to unite to stop him." },
    { name: "Joy Boy", series: "One Piece", wiki: "onepiece", page: "Joy Boy", keys: ["joy boy", "joyboy", "nika"], blurb: "The ancient liberator whose will lives in the Nika fruit — and Luffy." }
  ];
  var ARCS = [
    { title: "Land of Waves", series: "Naruto", wiki: "naruto", page: "Prologue — Land of Waves", keys: ["zabuza", "haku", "land of waves"], blurb: "Team 7's first real mission: a demon swordsman, a masked hunter, and a bridge named Great Naruto." },
    { name: null, title: "Chunin Exams", series: "Naruto", wiki: "naruto", page: "Chunin Exams (Arc)", keys: ["chunin", "orochimaru"], blurb: "Forest of Death, Neji vs fate, Gaara's sand — and Orochimaru's invasion plan." },
    { title: "Konoha Crush", series: "Naruto", wiki: "naruto", page: "Konoha Crush (Arc)", keys: ["hiruzen", "konoha crush"], blurb: "The Sand-Sound invasion. Hiruzen's last stand against his own student." },
    { title: "Sasuke Recovery Mission", series: "Naruto", wiki: "naruto", page: "Sasuke Recovery Mission", keys: ["sasuke", "valley of the end"], blurb: "Shikamaru leads the rookie squad. Naruto vs Sasuke at the Valley of the End." },
    { title: "Pain's Assault", series: "Naruto", wiki: "naruto", page: "Pain's Assault (Arc)", keys: ["pain", "nagato", "hinata"], blurb: "Shinra Tensei levels Konoha. Sage Mode Naruto returns to face all Six Paths." },
    { title: "Fourth Shinobi World War", series: "Naruto", wiki: "naruto", page: "Fourth Shinobi World War (Arc)", keys: ["madara", "obito", "war"], blurb: "Edo Tensei army, the Ten-Tails, Might Guy's Eighth Gate — the war that changed everything." },
    { title: "East Blue Saga", series: "One Piece", wiki: "onepiece", page: "East Blue Saga", keys: ["east blue", "arlong", "zoro joins"], blurb: "Luffy gathers Zoro, Nami, Usopp and Sanji — and declares war on Arlong Park." },
    { title: "Alabasta Saga", series: "One Piece", wiki: "onepiece", page: "Alabasta Saga", keys: ["crocodile", "vivi", "alabasta"], blurb: "Baroque Works, Crocodile's coup, and Vivi's tearful goodbye at the coast." },
    { title: "Water 7 Saga", series: "One Piece", wiki: "onepiece", page: "Water 7 Saga", keys: ["rob lucci", "enies lobby", "merry"], blurb: "CP9 takes Robin. The crew burns the flag of the World Government to get her back." },
    { title: "Summit War Saga", series: "One Piece", wiki: "onepiece", page: "Summit War Saga", keys: ["marineford", "ace", "whitebeard"], blurb: "Impel Down breakout, Marineford, three Admirals — and Ace's death." },
    { title: "Wano Country Arc", series: "One Piece", wiki: "onepiece", page: "Wano Country Arc", keys: ["kaido", "wano", "gear 5", "oden"], blurb: "Samurai, Yonko alliance, and Gear 5's drums of liberation over Onigashima." },
    { title: "Final Saga", series: "One Piece", wiki: "onepiece", page: "Final Saga", keys: ["egghead", "elbaf", "imu", "joy boy"], blurb: "Egghead's broadcast, Elbaf's legends, Imu's shadow — the endgame is here." }
  ];
  return { ANIME: ANIME, CHARACTERS: CHARACTERS, ARCS: ARCS };
})();
