"""Navigation reachability and non-destructive home/resume behavior."""
import json
import subprocess
import unittest
from html.parser import HTMLParser
from pathlib import Path
from build_navigation import PAGES, header
from test_connections import NODE

ROOT = Path(__file__).resolve().parent

class Elements(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.items = []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.items.append((tag, dict(attrs)))

class NavigationTests(unittest.TestCase):
    def test_every_screen_has_static_home_and_valid_navigation(self):
        for page in PAGES:
            text = (ROOT / (page+'.html')).read_text(encoding='utf-8')
            self.assertIn(header(page), text, page)
            elements = Elements(text).items
            ids = [a['id'] for _, a in elements if 'id' in a]
            self.assertEqual(len(ids), len(set(ids)), page+' duplicated IDs')
            self.assertEqual(ids.count('main'), 1, page)
            nav = Elements(header(page)).items
            for tag, attrs in nav:
                if tag == 'a' and not attrs['href'].startswith('#'):
                    self.assertTrue((ROOT / attrs['href']).is_file(), attrs['href'])
            self.assertIn('<a href="index.html"', header(page))
            self.assertIn('site-shell.css?v=flow3', text)
        from prepare_pages import STATIC_FILES
        published = {Path(p).stem for p in STATIC_FILES if p.endswith('.html')}
        self.assertTrue(published <= set(PAGES))
        self.assertIn('site-shell.js', STATIC_FILES)

    def test_primary_navigation_and_utilities_stay_out_of_creation_path(self):
        for page in PAGES:
            nav = header(page)
            self.assertNotIn('nav-more', nav)
            self.assertNotIn('studio.html', nav)
            self.assertNotIn('vision.html', nav)
            self.assertIn('재료 찾기', nav)
            self.assertIn('<a href="dashboard.html"', nav)
            self.assertNotIn('connectSession', nav)
        text = (ROOT/'connections.html').read_text(encoding='utf-8')
        self.assertGreater(text.index('id="connectSession"'), text.index('<main id="main">'))
        tools = text.index('<details id="workspaceTools"')
        self.assertGreater(tools, text.index('id="printWorkbench"'))
        for marker in ('id="loadPlanButton"', 'id="savePlan"', 'id="materialsDetails"', 'id="planDetails"', 'class="file-tools"'):
            self.assertGreater(text.index(marker), tools)
        self.assertNotIn('class="technical-links"', text)
        home = (ROOT/'index.html').read_text(encoding='utf-8')
        self.assertNotIn('class="home-resources"', home)
        self.assertIn('class="home-operations"', home)
        self.assertIn('class="home-archive"', home)

    def test_home_preserves_draft_and_handles_unavailable_storage(self):
        source = json.dumps((ROOT/'entry.js').read_text(encoding='utf-8'))
        js = r'''
        const vm=require('node:vm'),assert=require('node:assert/strict');
        const source=SOURCE;
        for(const raw of [null,'{invalid}',JSON.stringify({plan:{nodes:[{id:'one'},{id:'two'}]}}),'denied']){
          const elements={startLabel:{},resumeNote:{}},listeners={};
          const storage={getItem(){if(raw==='denied')throw Error('denied');return raw;},setItem(){throw Error('Home must not write drafts');},removeItem(){throw Error('Home must not clear drafts');}};
          const context={document:{getElementById:id=>elements[id]},localStorage:storage,window:{addEventListener:(name,fn)=>listeners[name]=fn}};
          vm.runInNewContext(source,context);
          if(raw&&raw.includes('nodes')){assert.equal(elements.startLabel.textContent,'이어서 문항 만들기');assert.ok(elements.resumeNote.textContent.includes('2개'));}
          else assert.equal(elements.startLabel.textContent,'문항 만들기');
          listeners.pageshow();
        }
        '''.replace('SOURCE', source)
        subprocess.run([NODE, '-e', js], cwd=ROOT, check=True, capture_output=True)

if __name__ == '__main__':
    unittest.main()
