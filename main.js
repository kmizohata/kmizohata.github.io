(function () {
  var root = document.documentElement;

  var titleEl = document.querySelector('title');
  var titleJa = titleEl ? titleEl.textContent : document.title;
  var titleEn = titleEl && titleEl.getAttribute('data-en');
  function renderTitle() {
    document.title = (root.getAttribute('data-ui') === 'en' && titleEn) ? titleEn : titleJa;
  }
  renderTitle();

  function renderDate() {
    var el = document.getElementById('last-updated');
    if (!el) return;
    var d = new Date(document.lastModified);
    var ui = root.getAttribute('data-ui');
    el.textContent = d.toLocaleDateString(ui === 'en' ? 'en-US' : 'ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  renderDate();

  document.getElementById('lang-btn').addEventListener('click', function () {
    var next = root.getAttribute('data-ui') === 'ja' ? 'en' : 'ja';
    root.setAttribute('data-ui', next);
    root.lang = next;
    try { localStorage.setItem('lang', next); } catch (e) {}
    renderDate();
    renderTitle();
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-count-of]'), function (link) {
    var n = document.querySelectorAll(link.getAttribute('data-count-of')).length;
    var badge = document.createElement('span');
    badge.className = 'count';
    badge.textContent = n;
    link.appendChild(badge);
  });

  function toResearchCard(article, page) {
    var card = document.createElement('a');
    card.className = 'card';
    card.href = page + (article.id ? '#' + article.id : '');
    var title = article.querySelector('h2, h3');
    var tags = article.querySelector('.tags');
    if (title) {
      var h3 = document.createElement('h3');
      h3.innerHTML = title.innerHTML;
      card.appendChild(h3);
    }
    if (tags) card.appendChild(document.importNode(tags, true));
    return card;
  }

  var TALK_NEWS = {
    oral:    { ja: ' で口頭発表しました',     en: 'Gave an oral presentation at ' },
    poster:  { ja: ' でポスター発表しました', en: 'Presented a poster at ' },
    invited: { ja: ' で招待講演を行いました', en: 'Gave an invited talk at ' }
  };
  function talkNewsItems(talksDoc, doc) {
    var out = [];
    Object.keys(TALK_NEWS).forEach(function (id) {
      var sec = talksDoc.getElementById(id);
      if (!sec) return;
      Array.prototype.forEach.call(sec.querySelectorAll('li.talk'), function (talk) {
        var time = talk.querySelector('time');
        var ja = talk.querySelector('.venue [lang="ja"]');
        var en = talk.querySelector('.venue [lang="en"]');
        if (!time || !ja) return;
        var d = time.getAttribute('datetime') || '';
        var li = doc.createElement('li');
        li.innerHTML = '<time datetime="' + d + '">' + d + '</time><span>' +
          '<span lang="ja"></span><span lang="en"></span></span>';
        li.querySelector('[lang="ja"]').textContent = ja.textContent + TALK_NEWS[id].ja;
        li.querySelector('[lang="en"]').textContent = TALK_NEWS[id].en + (en ? en.textContent : ja.textContent).replace(/^The /, 'the ');
        out.push(li);
      });
    });
    return out;
  }
  function addTalksToNews(ul, talksDoc) {
    var doc = ul.ownerDocument;
    var items = Array.prototype.slice.call(ul.querySelectorAll(':scope > li')).concat(talkNewsItems(talksDoc, doc));
    var key = function (li) { var t = li.querySelector('time'); return t ? t.getAttribute('datetime') || '' : ''; };
    items.sort(function (a, b) { return key(b).localeCompare(key(a)); });
    items.forEach(function (li) { ul.appendChild(li); });
  }
  function fetchDoc(url) {
    return fetch(url)
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.text(); })
      .then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); });
  }
  function withTalks(doc) {
    var ul = doc.querySelector('ul.news[data-add-talks]');
    if (!ul) return Promise.resolve(doc);
    return fetchDoc(ul.getAttribute('data-add-talks'))
      .then(function (talksDoc) { addTalksToNews(ul, talksDoc); return doc; })
      .catch(function () { return doc; });
  }

  if (window.fetch && window.DOMParser) {
    if (document.querySelector('ul.news[data-add-talks]')) withTalks(document);

    Array.prototype.forEach.call(document.querySelectorAll('[data-recent-from]'), function (box) {
      var count = parseInt(box.getAttribute('data-count'), 10) || Infinity;
      var page = box.getAttribute('data-recent-from');
      var select = box.getAttribute('data-recent-select');
      var as = box.getAttribute('data-recent-as');
      fetchDoc(page)
        .then(withTalks)
        .then(function (doc) {
          var items = doc.querySelectorAll(select);
          if (!items.length) return;
          box.innerHTML = '';
          for (var i = 0; i < items.length && i < count; i++) {
            box.appendChild(as === 'research-card' ? toResearchCard(items[i], page) : document.importNode(items[i], true));
          }
        })
        .catch(function () {
          if (!box.hasAttribute('data-recent-error')) return;
          var tag = /^(UL|OL)$/.test(box.tagName) ? 'li' : 'p';
          box.innerHTML = '<' + tag + ' class="load-error"><span lang="ja">読み込みに失敗しました</span><span lang="en">Failed to load.</span></' + tag + '>';
        });
    });
  }

  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menu-btn');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
