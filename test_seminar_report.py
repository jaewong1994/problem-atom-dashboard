"""Public report integrity, provenance, navigation, and real filtering behavior."""
import json, re, subprocess, unittest
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from build_seminar_report import GROUPS, TOPICS, render
ROOT=Path(__file__).resolve().parent
NAME='seminar-structure-report'

class Links(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.links=[];self.feed(text)
    def handle_starttag(self,t,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        for k in ('href','src'):
            if k in a:self.links.append(a[k])

class SeminarReportTests(unittest.TestCase):
    def setUp(self):self.d=json.loads((ROOT/(NAME+'.json')).read_text(encoding='utf8'))
    def test_counts_are_distinct_recomputable_units(self):
        d=self.d;s=d['summary'];r=d['records'];o=d['operations']
        self.assertEqual((s['records'],s['operations'],s['bridges'],s['hidden_grammar']),(len(r),len(o),sum(x['kind']=='bridge' for x in o),sum(x['exposure']=='grammar' for x in o)))
        self.assertEqual(s['linked_records']+s['reference_records'],s['records'])
        self.assertEqual(d['kind_counts'],dict(Counter(x['kind'] for x in r)))
        self.assertEqual(sum(d['kind_counts'].values()),138)
        self.assertEqual(d['role_counts'],dict(Counter(x['influence']['role'] for x in o)))
        self.assertEqual(d['curriculum_counts'],{'수학Ⅱ':73})
    def test_mapping_is_exhaustive_without_duplicate_or_automatic_approval(self):
        ops=self.d['operations'];flat=[v for group in GROUPS.values() for v in group]
        self.assertEqual(len(flat),len(set(flat)))
        self.assertEqual(set(flat),{o['id'] for o in ops})
        self.assertEqual(self.d['topics'],TOPICS)
        records={r['id'] for r in self.d['records']}
        for o in ops:
            self.assertIn(o['id'],GROUPS[o['proposed_topic']])
            self.assertEqual(o['review_status'],'ai_candidate')
            self.assertEqual(o['classification_status'],'ai_proposal')
            self.assertTrue(set(o['supports'])<=records)
            self.assertTrue(o['requires'] and o['provides'] and o['guard_note'])
        self.assertFalse(self.d['registry_mutated'])
    def test_snapshot_does_not_claim_deployment_or_human_calibration(self):
        d=self.d
        self.assertEqual(d['deployed_at_audit']['operations'],46)
        self.assertEqual(d['deployed_at_audit']['records'],107)
        self.assertEqual(sum(o['available_in_deployed_engine_at_audit'] for o in d['operations']),46)
        self.assertEqual(sum(b['count'] for b in d['authored_batches']),20)
        self.assertEqual([b['range'] for b in d['authored_batches']],[[1,5],[6,10],[11,20]])
        for b in d['authored_batches']:
            self.assertTrue(b['symbolic_regression_passed'])
            self.assertFalse(b['human_approved'] or b['difficulty_calibrated'])
            self.assertRegex(b['document_sha256'],r'^[a-f0-9]{64}$')
    def test_public_snapshot_has_no_item_text_credentials_or_local_paths(self):
        text=(ROOT/(NAME+'.json')).read_text(encoding='utf8')
        for value in ['C:/Users/','C:\\\\Users\\\\','"question":','"solution":','service_role','access_token','password','auth.users']:
            self.assertNotIn(value,text)
        self.assertTrue(all(re.fullmatch('[a-f0-9]{64}',s['sha256']) for s in self.d['source_files']))
    def test_candidate_bundles_cover_twenty_items_without_becoming_contracts(self):
        bundles=self.d['bundle_candidates'];known={o['id'] for o in self.d['operations']}
        self.assertEqual(len(bundles),9)
        self.assertEqual({n for b in bundles for n in b['evidence_item_numbers']},set(range(1,21)))
        for b in bundles:
            self.assertTrue(set(b['related_operations'])<=known)
            self.assertEqual(b['status'],'ai_proposal')
            self.assertFalse(b['executable'])
            self.assertTrue(b['requires_new_review'])
    def test_render_is_reproducible_and_all_links_exist(self):
        old=(ROOT/(NAME+'.html')).read_text(encoding='utf8');render()
        self.assertEqual(old,(ROOT/(NAME+'.html')).read_text(encoding='utf8'))
        parsed=Links(old)
        self.assertEqual(len(parsed.ids),len(set(parsed.ids)))
        for url in parsed.links:
            if url.startswith('#'):self.assertIn(url[1:],parsed.ids)
            elif not url.startswith('http'):self.assertTrue((ROOT/url.split('?')[0]).exists(),url)
        self.assertEqual(old.count('class="inventory-item"'),73)
        self.assertIn(NAME+'.html',(ROOT/'index.html').read_text(encoding='utf8'))
        self.assertNotIn('account-client.js',old)
    def test_filters_combine_search_topic_empty_and_reset(self):
        source=json.dumps((ROOT/(NAME+'.js')).read_text(encoding='utf8'))
        js='''const vm=require('node:vm'),assert=require('node:assert/strict');
        const ctl=()=>({value:'',handlers:{},addEventListener(k,f){this.handlers[k]=f},focus(){this.focused=true}});
        const controls={'report-search':ctl(),'report-topic':ctl(),'report-reset':ctl(),'report-count':{},'report-empty':{}};
        const rows=[{dataset:{topic:'count',search:'개수함수 교점'}},{dataset:{topic:'integral',search:'정적분으로 정의된 함수'}},{dataset:{topic:'absolute',search:'절댓값 교점'}}];
        const filters={hidden:true};const document={getElementById:id=>controls[id],querySelector:s=>filters,querySelectorAll:s=>rows};
        vm.runInNewContext(SOURCE,{document});assert.equal(filters.hidden,false);
        const s=controls['report-search'],t=controls['report-topic'];s.value='교점';s.handlers.input();assert.equal(rows.filter(x=>!x.hidden).length,2);
        t.value='count';t.handlers.change();assert.equal(rows.filter(x=>!x.hidden).length,1);
        s.value='없는내용';s.handlers.input();assert.equal(controls['report-empty'].hidden,false);
        controls['report-reset'].handlers.click();assert.equal(rows.filter(x=>!x.hidden).length,3);assert.equal(s.focused,true);
        s.value='정적분 함수';s.handlers.input();assert.equal(rows.filter(x=>!x.hidden).length,1);
        '''.replace('SOURCE',source)
        p=subprocess.run(['node','-e',js],cwd=ROOT,capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stderr)

if __name__=='__main__':unittest.main()
