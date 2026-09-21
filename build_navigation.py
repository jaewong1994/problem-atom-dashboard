"""Render one static navigation on all project screens."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PAGES = ('index', 'connections', 'asset-library', 'motif-library', 'dashboard',
         'promotion-board', 'vision', 'studio', 'pilot-review')
PRIMARY = (('index', '홈'), ('connections', '문항 만들기'), ('promotion-board', '재료 검수'), ('asset-library', '재료 찾기'), ('dashboard', '현황판'))

def header(page):
    active = 'asset-library' if page == 'motif-library' else page
    def link(key, name):
        state = ' aria-current="page"' if key == active else ''
        return f'<a href="{key}.html"{state}>{name}</a>'
    return ('<a class="skip-link" href="#main">본문으로 건너뛰기</a>\n'
            '<header class="global-header"><a class="global-brand" href="index.html" aria-label="Problem Atom 홈">'
            '<b aria-hidden="true">PA</b><span>Problem Atom</span></a>'
            '<nav class="global-nav" aria-label="주요 메뉴">' + ''.join(link(*item) for item in PRIMARY) +
            '</nav></header>')

def build():
    for page in PAGES:
        path = ROOT / f'{page}.html'
        text = path.read_text(encoding='utf-8')
        account_assets = '<script defer src="account-config.js?v=team2"></script><script defer src="account-supabase.js?v=team2"></script><script defer src="account-client.js?v=setup6"></script><link rel="stylesheet" href="account.css?v=team2">'
        text = re.sub(r'<script defer src="account-config.js[^\"]*"></script>(?:<script defer src="account-supabase.js[^\"]*"></script>)?<script defer src="account-client.js[^\"]*"></script><link rel="stylesheet" href="account.css[^\"]*">', account_assets, text)
        if 'account-config.js' not in text:
            text = text.replace('<head>', '<head>' + account_assets, 1)
        text = text.replace('site-shell.css?v=flow2', 'site-shell.css?v=flow3')
        text, count = re.subn(r'<!--SITE_NAV-->.*?<!--/SITE_NAV-->',
                             '<!--SITE_NAV-->\n' + header(page) + '\n<!--/SITE_NAV-->', text, flags=re.S)
        if count != 1:
            raise ValueError(f'{page}: common navigation marker missing or duplicated')
        path.write_text(text, encoding='utf-8')

if __name__ == '__main__':
    build()
