"""Render one static navigation on all project screens."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PAGES = ('index', 'connections', 'asset-library', 'motif-library', 'dashboard',
         'promotion-board', 'vision', 'studio', 'pilot-review')
PRIMARY = (('index', '홈'), ('connections', '문항 만들기'), ('asset-library', '재료·사례'))
SECONDARY = (('dashboard', '기출 분석 현황'), ('promotion-board', '재료 검수'),
             ('vision', '프로젝트 안내'), ('studio', '이전 문항 보관함'))

def header(page):
    active = 'asset-library' if page == 'motif-library' else page
    def link(key, name):
        state = ' aria-current="page"' if key == active else ''
        return f'<a href="{key}.html"{state}>{name}</a>'
    more_active = ' data-current="true"' if page in dict(SECONDARY) else ''
    more = (f'<details class="nav-more"{more_active}><summary>분석·검수</summary>'
            '<div class="nav-more-links">' + ''.join(link(*item) for item in SECONDARY) + '</div></details>')
    session = ('<button id="connectSession" class="session-link" type="button">'
               '<span class="dot" aria-hidden="true"></span><span id="sessionBadge">Codex 연결</span></button>') if page == 'connections' else ''
    return ('<a class="skip-link" href="#main">본문으로 건너뛰기</a>\n'
            '<header class="global-header"><a class="global-brand" href="index.html" aria-label="Problem Atom 홈">'
            '<b aria-hidden="true">PA</b><span>Problem Atom</span></a>'
            '<nav class="global-nav" aria-label="주요 메뉴">' + ''.join(link(*item) for item in PRIMARY) + more +
            '</nav>' + session + '</header>')

def build():
    for page in PAGES:
        path = ROOT / f'{page}.html'
        text = path.read_text(encoding='utf-8')
        text, count = re.subn(r'<!--SITE_NAV-->.*?<!--/SITE_NAV-->',
                             '<!--SITE_NAV-->\n' + header(page) + '\n<!--/SITE_NAV-->', text, flags=re.S)
        if count != 1:
            raise ValueError(f'{page}: common navigation marker missing or duplicated')
        path.write_text(text, encoding='utf-8')

if __name__ == '__main__':
    build()
