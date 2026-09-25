/* VerseTube — Wallpapers tab (4KWallVerse collection via vt-proxy) */
document.addEventListener('DOMContentLoaded', function () {
  var VAULT = 'https://coc-image-vault.vercel.app';
  var PROXY = 'https://vt-proxy-xi.vercel.app/api/proxy?url=' + encodeURIComponent(VAULT + '/api/list');

  var allFiles = [];
  var shown = [];
  var section = 'main';
  var query = '';
  var lbIdx = -1;
  var renderTimer = null;

  VT.initTheme();
  VT.initNav('wallpapers');

  /* ---- image dimension cache (per origin) ---- */
  var dims = {};
  try { dims = JSON.parse(localStorage.getItem('vt:wallDims') || '{}'); } catch (e) { dims = {}; }
  function saveDims() {
    try { localStorage.setItem('vt:wallDims', JSON.stringify(dims)); } catch (e) {}
  }

  var encPath = function (n) {
    return n.split('/').map(encodeURIComponent).join('/');
  };
  var fmtSize = function (n) {
    return n > 1e9 ? (n / 1e9).toFixed(2) + ' GB' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n > 1e3 ? Math.round(n / 1e3) + ' KB' : n + ' B';
  };
  var prettyName = function (f) {
    var base = f.name.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    return base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var isPortrait = function (f) {
    var d = dims[f.name];
    return d && d[1] > d[0];
  };
  var scheduleRender = function () {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 250);
  };

  /* ---- probe dimensions for orientation split (same URL the cards use) ---- */
  var probing = {};
  function probeDims(f, viaApi) {
    if (dims[f.name] || probing[f.name]) return;
    probing[f.name] = 1;
    var im = new Image();
    im.onload = function () {
      dims[f.name] = [im.naturalWidth, im.naturalHeight];
      saveDims();
      scheduleRender();
    };
    im.onerror = function () {
      delete probing[f.name];
      if (!viaApi) {
        probing[f.name] = 1;
        im.onerror = function () { delete probing[f.name]; };
        im.src = VAULT + '/api/thumb?name=' + encodeURIComponent(f.name) + '&w=640';
      }
    };
    im.src = viaApi
      ? VAULT + '/api/thumb?name=' + encodeURIComponent(f.name) + '&w=640'
      : VAULT + '/thumbs/640/' + encPath(f.name) + '.webp';
  }

  /* ---- cards ---- */
  function makeCard(f, idx) {
    var d = dims[f.name];
    var ratio = d ? d[0] + '/' + d[1] : (isPortrait(f) ? '9/16' : '16/9');
    var card = document.createElement('article');
    card.className = 'wall-card';
    card.innerHTML =
      '<div class="wall-thumb" style="aspect-ratio:' + ratio + '">' +
      '<img loading="lazy" decoding="async" alt="' + VT.esc(prettyName(f)) + '" ' +
      'src="' + VAULT + '/thumbs/640/' + encPath(f.name) + '.webp">' +
      '<span class="wall-badge">4K</span>' +
      '</div>' +
      '<div class="wall-info"><div class="wall-text">' +
      '<div class="wall-name">' + VT.esc(prettyName(f)) + '</div>' +
      '<div class="wall-sub">' + fmtSize(f.size) + ' · ' + (f.name.split('.').pop() || '').toUpperCase() + '</div>' +
      '</div><a class="wall-dl" href="' + f.dl + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Get</a></div>';

    var img = card.querySelector('img');
    img.addEventListener('error', function () {
      img.removeEventListener('error', arguments.callee);
      img.src = VAULT + '/api/thumb?name=' + encodeURIComponent(f.name) + '&w=640';
    });
    img.addEventListener('load', function () {
      img.classList.add('on');
      if (!dims[f.name] && img.naturalWidth) {
        dims[f.name] = [img.naturalWidth, img.naturalHeight];
        saveDims();
        if (img.naturalHeight > img.naturalWidth) scheduleRender(); // moved to portrait group
      }
    });

    card.addEventListener('click', function () { openLb(idx); });
    return card;
  }

  /* ---- render ---- */
  function render() {
    var tabFiles = allFiles.filter(function (f) { return (f.section || 'main') === section; });
    shown = tabFiles.filter(function (f) {
      return !query || prettyName(f).toLowerCase().indexOf(query) !== -1 || f.name.toLowerCase().indexOf(query) !== -1;
    });
    shown.forEach(function (f) { probeDims(f, false); });

    var ls = [], pt = [];
    shown.forEach(function (f) { (isPortrait(f) ? pt : ls).push(f); });
    shown = ls.concat(pt); // lightbox order follows display order

    var total = tabFiles.reduce(function (s, f) { return s + f.size; }, 0);
    var wc = document.getElementById('wallCount');
    if (wc) wc.textContent = tabFiles.length + ' wallpapers · ' + fmtSize(total);
    document.getElementById('cntMain').textContent = allFiles.filter(function (f) { return (f.section || 'main') === 'main'; }).length || '';
    document.getElementById('cntFan').textContent = allFiles.filter(function (f) { return f.section === 'fan'; }).length || '';

    var empty = document.getElementById('wallEmpty');
    var both = ls.length > 0 && pt.length > 0;
    document.getElementById('headLand').style.display = both ? '' : 'none';
    document.getElementById('headPort').style.display = both ? '' : 'none';
    empty.hidden = shown.length > 0;

    var gL = document.getElementById('gridLand');
    var gP = document.getElementById('gridPort');
    gL.innerHTML = '';
    gP.innerHTML = '';
    document.getElementById('grpLand').hidden = ls.length === 0;
    document.getElementById('grpPort').hidden = pt.length === 0;
    ls.forEach(function (f, i) { gL.appendChild(makeCard(f, i)); });
    pt.forEach(function (f, i) { gP.appendChild(makeCard(f, ls.length + i)); });
  }

  /* ---- lightbox ---- */
  function openLb(i) {
    if (!shown.length) return;
    lbIdx = (i + shown.length) % shown.length;
    var f = shown[lbIdx];
    var img = document.getElementById('lbImg');
    img.onerror = function () {
      img.onerror = null;
      img.src = VAULT + '/api/thumb?name=' + encodeURIComponent(f.name) + '&w=1600';
    };
    img.src = VAULT + '/thumbs/1280/' + encPath(f.name) + '.webp';
    document.getElementById('lbName').textContent = prettyName(f);
    document.getElementById('lbMeta').textContent = fmtSize(f.size) + ' · ' + (f.name.split('.').pop() || '').toUpperCase() + ' · 4K';
    document.getElementById('lbDl').href = f.dl;
    document.getElementById('wallLb').classList.add('show');
  }
  function closeLb() { document.getElementById('wallLb').classList.remove('show'); }

  /* ---- load ---- */
  function load(noCache) {
    var loading = document.getElementById('wallLoading');
    var err = document.getElementById('wallErr');
    loading.hidden = false;
    err.hidden = true;
    VT.fetchJSON(PROXY, { cacheKey: 'walls', ttl: 5 * 60e3, noCache: !!noCache })
      .then(function (r) {
        if (!r.data || !Array.isArray(r.data.files)) throw new Error('bad response');
        allFiles = r.data.files;
        loading.hidden = true;
        render();
      })
      .catch(function (e) {
        loading.hidden = true;
        err.hidden = false;
        document.getElementById('wallErrMsg').textContent = 'Couldn’t reach the gallery (' + e.message + ').';
      });
  }

  /* ---- events ---- */
  document.querySelectorAll('#wallTabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      section = b.getAttribute('data-section');
      document.querySelectorAll('#wallTabs button').forEach(function (x) { x.classList.toggle('active', x === b); });
      render();
      document.getElementById('main').scrollTo ? document.getElementById('main').scrollTo(0, 0) : window.scrollTo(0, 0);
    });
  });
  var s = document.getElementById('wallSearch');
  s.addEventListener('input', function () { query = s.value.trim().toLowerCase(); render(); });

  document.getElementById('shuffleBtn').addEventListener('click', function () {
    for (var i = allFiles.length - 1; i > 0; i--) {
      var k = Math.floor(Math.random() * (i + 1));
      var t = allFiles[i]; allFiles[i] = allFiles[k]; allFiles[k] = t;
    }
    render();
    VT.toast('Shuffled!');
  });

  document.getElementById('wallRetry').addEventListener('click', function () { load(true); });
  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', function () { openLb(lbIdx - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { openLb(lbIdx + 1); });
  document.getElementById('wallLb').addEventListener('click', function (e) {
    if (e.target.id === 'wallLb') closeLb();
  });
  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('wallLb').classList.contains('show')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(lbIdx - 1);
    if (e.key === 'ArrowRight') openLb(lbIdx + 1);
  });

  var top = document.getElementById('topSearch');
  if (top) top.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && top.value.trim()) location.href = '/characters.html?q=' + encodeURIComponent(top.value.trim());
  });

  load();
});
