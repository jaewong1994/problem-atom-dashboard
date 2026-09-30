"""The session category preserves manuscripts, paired solutions and original downloads."""
import hashlib
import json
import subprocess
import unittest
from pathlib import Path
from test_connections import NODE

ROOT = Path(__file__).resolve().parent


class SessionCollectionTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'session-collection.json').read_text(encoding='utf-8'))

    def test_unique_items_keep_answers_solutions_and_content_fingerprints(self):
        items = self.data['items']
        self.assertEqual(len(items), 25)
        self.assertEqual(len({i['id'] for i in items}), 25)
        self.assertEqual([i['number'] for i in items if i['group'] != 'core-difficulty'], list(range(1, 21)))
        self.assertEqual(sum(i['group'] == 'core-difficulty' for i in items), 5)
        for item in items:
            content = {k: item[k] for k in ('question', 'answer', 'solution')}
            for value in content.values():
                self.assertTrue(value, item['id'])
            actual = hashlib.sha256(json.dumps(content, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
            self.assertEqual(actual, item['source_content_sha256'], item['id'])
            self.assertFalse(item['human_approved'])
        self.assertEqual([i['answer'] for i in items[:5]], ['52', '12', '15', '5', '95'])

    def test_every_formula_renders_without_error(self):
        script = r'''
const fs=require('node:fs'),katex=require('./vendor/katex/katex.min.js');
const data=JSON.parse(fs.readFileSync('session-collection.json','utf8'));
for(const item of data.items)for(const text of [...item.question,item.answer,...item.solution]) {
  for(const m of text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)) {
    try{katex.renderToString(m[1]||m[2],{displayMode:!!m[1],throwOnError:true,trust:false,maxExpand:1000});}
    catch(e){throw Error(item.id+': '+e.message);}
  }
}
'''
        result = subprocess.run([NODE, '-e', script], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_downloads_are_original_paired_files_without_private_reports(self):
        downloads = [f for group in self.data['groups'] for f in group['downloads']]
        self.assertEqual(len(downloads), 6)
        for file in downloads:
            self.assertTrue(file['href'].startswith('assets/session-created/'))
            path = (ROOT / file['href']).resolve()
            self.assertTrue(path.is_relative_to(ROOT / 'assets' / 'session-created'))
            self.assertIn(path.suffix, ('.pdf', '.hwpx'))
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), file['sha256'])
        text = json.dumps(self.data, ensure_ascii=False)
        for private in ('C:/', 'C:\\', 'seminar-structure-report', 'api_key', 'connection_recheck'):
            self.assertNotIn(private, text)
        page = (ROOT / 'connections.html').read_text(encoding='utf-8')
        for marker in ('id="creationWorkspace"', 'id="sessionCollection"', 'href="#session-collection"'):
            self.assertIn(marker, page)
        from prepare_pages import STATIC_FILES
        for name in ('session-collection.json', 'session-collection.js', 'session-collection.css'):
            self.assertIn(name, STATIC_FILES)


if __name__ == '__main__':
    unittest.main()
