(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const node = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  let catalog = null;

  function showWorkspace() {
    // The login flow preserves query parameters, so shared category links use view=.
    const viewing = location.hash === '#session-collection' ||
      (!location.hash && new URLSearchParams(location.search).get('view') === 'session-collection');
    $('creationWorkspace').hidden = viewing;
    $('sessionCollection').hidden = !viewing;
    document.body.classList.toggle('viewing-collection', viewing);
    for (const a of document.querySelectorAll('.workspace-switch a')) {
      if ((a.hash === '#session-collection') === viewing) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }

  // Keep source text unchanged and render math as text-safe, untrusted KaTeX.
  function mathParagraph(text) {
    const p = node('p');
    let start = 0;
    for (const m of String(text).matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)) {
      p.append(document.createTextNode(text.slice(start, m.index)));
      const span = node('span', null, m[1] ? 'collection-display-math' : null);
      if (window.katex) window.katex.render(m[1] || m[2], span,
        { displayMode: !!m[1], throwOnError: false, trust: false, maxExpand: 1000 });
      else span.textContent = m[0];
      p.append(span);
      start = m.index + m[0].length;
    }
    p.append(document.createTextNode(text.slice(start)));
    return p;
  }

  function manuscript(lines, conditions) {
    const body = node('div', null, 'collection-manuscript');
    let box = null;
    for (const line of lines) {
      if (conditions && /^\([가나다라마바사]\)/.test(line)) {
        if (!box) { box = node('div', null, 'collection-conditions'); body.append(box); }
        box.append(mathParagraph(line));
      } else {
        box = null;
        body.append(mathParagraph(line));
      }
    }
    return body;
  }

  function itemCard(item) {
    const details = node('details', null, 'collection-item');
    details.dataset.itemId = item.id;
    const summary = node('summary');
    const title = node('span', null, 'collection-item-heading');
    title.append(node('span', item.label, 'collection-number'), node('strong', item.title));
    summary.append(title, node('span', '문제 펼치기', 'collection-open-label'));
    details.append(summary);
    details.addEventListener('toggle', () => {
      summary.querySelector('.collection-open-label').textContent = details.open ? '문제 접기' : '문제 펼치기';
      if (!details.open || details.dataset.rendered) return;
      details.dataset.rendered = 'true';
      const content = node('div', null, 'collection-item-content');
      content.append(node('p', item.difficulty, 'collection-difficulty'), manuscript(item.question, true));
      const solution = node('details', null, 'collection-solution');
      solution.append(node('summary', '정답과 해설 보기'));
      const answer = node('div', null, 'collection-answer');
      answer.append(node('strong', '정답'), mathParagraph(item.answer));
      solution.append(answer, manuscript(item.solution, false));
      content.append(solution);
      details.append(content);
    });
    return details;
  }

  function render() {
    if (!catalog) return;
    const query = $('collectionSearch').value.trim().toLocaleLowerCase();
    const selected = $('collectionGroup').value;
    const items = catalog.items.filter(item => (!selected || item.group === selected) &&
      (!query || `${item.label} ${item.title} ${item.question.join(' ')}`.toLocaleLowerCase().includes(query)));
    $('collectionResults').replaceChildren();
    $('collectionStatus').textContent = `전체 ${catalog.items.length}문항 · 현재 ${items.length}문항`;
    $('collectionReset').hidden = !selected && !query;
    if (!items.length) {
      $('collectionResults').append(node('p', '해당하는 문항이 없습니다. 검색어를 바꾸거나 검색 초기화를 눌러 주세요.', 'collection-empty'));
      return;
    }
    for (const group of catalog.groups) {
      const groupItems = items.filter(item => item.group === group.id);
      if (!groupItems.length) continue;
      const section = node('section', null, 'collection-group');
      const heading = node('div', null, 'collection-group-heading');
      const copy = node('div');
      copy.append(node('h3', group.label), node('p', `${group.summary} · ${group.edition}`));
      heading.append(copy);
      if (group.downloads.length) {
        const downloads = node('div', null, 'collection-downloads');
        for (const file of group.downloads) {
          const a = node('a', file.label);
          a.href = file.href;
          a.download = `${group.label}${file.href.endsWith('.pdf') ? '.pdf' : '.hwpx'}`;
          downloads.append(a);
        }
        heading.append(downloads);
      }
      section.append(heading);
      for (const item of groupItems) section.append(itemCard(item));
      $('collectionResults').append(section);
    }
  }

  async function load() {
    $('collectionRetry').hidden = true;
    $('collectionStatus').textContent = '제작 문항을 불러오고 있습니다.';
    try {
      const response = await fetch('session-collection.json?v=session1');
      if (!response.ok) throw new Error('Collection unavailable');
      const next = await response.json();
      if (next.schema !== 'problem-atom/session-collection/1' || !Array.isArray(next.items)) throw new Error('Invalid collection');
      catalog = next;
      $('collectionCount').textContent = `${catalog.items.length}`;
      $('collectionGroup').replaceChildren(new Option('전체 문항', ''));
      for (const group of catalog.groups) $('collectionGroup').append(new Option(group.label, group.id));
      render();
    } catch (_error) {
      $('collectionStatus').textContent = '문항 모음을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';
      $('collectionRetry').hidden = false;
    }
  }

  $('collectionSearch').addEventListener('input', render);
  $('collectionGroup').addEventListener('change', render);
  $('collectionReset').addEventListener('click', () => {
    $('collectionSearch').value = '';
    $('collectionGroup').value = '';
    render();
  });
  $('collectionRetry').addEventListener('click', load);
  window.addEventListener('hashchange', showWorkspace);
  showWorkspace();
  load();
})();
