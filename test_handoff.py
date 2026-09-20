"""Web handoff/import/export boundaries. Model fixtures remain temporary."""
from test_model import run_js
from test_connections import ROOT
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET


class HandoffTests(unittest.TestCase):
    def test_web_prompt_preserves_selected_plan_and_uses_no_other_provider(self):
        run_js(r"""
        const W=require('./web-handoff.js'),text=W.prompt(job,'gemini');
        assert.ok(text.includes(job.request_id));assert.ok(text.includes(job.registry_revision));
        const payload=JSON.parse(text.slice(text.indexOf('\n\n{')+2));
        assert.deepEqual(payload.seed_plan,job.seed_plan);
        assert.deepEqual(payload.knowledge.operations.map(o=>o.id).sort(),[...new Set(plan.nodes.map(n=>n.id))].sort());
        for(const op of payload.knowledge.operations)for(const p of [...op.requires,...op.provides,...op.forbids])assert.ok(payload.knowledge.types[p.type]);
        assert.deepEqual(payload.response_schema,C.RESULT_SCHEMA);assert.ok(!payload.preferred_model);
        assert.throws(()=>W.prompt(job,'unknown'));assert.throws(()=>W.canonicalRequest({...job,registry_revision:'old'},R));
        """)

    def test_web_parser_accepts_json_or_single_fence_and_never_guesses(self):
        run_js(r"""
        const W=require('./web-handoff.js'),raw=JSON.stringify(sample());
        for(const text of [raw,'\uFEFF'+raw,'```json\n'+raw+'\n```'])assert.deepEqual(W.parse(text),sample());
        for(const text of ['말씀하신 결과입니다. '+raw,'```json\n'+raw+'\n```\n다른 내용',raw.slice(0,-4),'[1,2]','null','x'.repeat(2000001),'process.exit(0)'])assert.throws(()=>W.parse(text));
        assert.equal(C.validateResult({...sample(),request_id:'REQ-other'},job,R,E).accepted,false);
        """)

    def test_export_revalidates_bundle_ignores_forged_approval(self):
        run_js(r"""
        const H=require('./server/export-hwpx.cjs'),W=require('./web-handoff.js'),item={request:job,result:sample()},bundle=W.bundle([item]);
        assert.equal(H.validateBundle(bundle,R).length,1);
        for(const bad of [{...bundle,items:[]},{...bundle,items:Array(21).fill(item)},{...bundle,items:[item,item]},W.bundle([{...item,result:{...sample(),unresolved:['문제 있음']},validation:{accepted:true}}]),W.bundle([{...item,request:{...job,registry_revision:'old'}}])])assert.throws(()=>H.validateBundle(bad,R));
        const output=H.validateBundle(bundle,R)[0];assert.deepEqual(Object.keys(output),['question','answer','solution']);assert.ok(!JSON.stringify(output).includes('형식 검사 전용'));
        """)

    def test_authenticated_export_and_web_record_import(self):
        run_js(r"""
        const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),W=require('./web-handoff.js'),{createSessionService}=require('./server/session-service.cjs');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-handoff-test-'));let count=0;
        const app=createSessionService({registry:R,siteDir:folder,stateDir:folder,port:0,token:'test',auth:async()=>({ready:false,reason:'로그인 없음'}),exporter:async()=>{count++;return Buffer.from('PK-fixture');}});
        await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port,headers={'X-PA-Session':'test','Content-Type':'application/json',Origin:base};
        const post=(route,body,h=headers)=>fetch(base+route,{method:'POST',headers:h,body:JSON.stringify(body)}),item={request:job,result:sample()};
        try{
         assert.equal((await post('/session/export-hwpx',W.bundle([item]),{'Content-Type':'application/json'})).status,401);
         assert.equal((await post('/session/export-hwpx',W.bundle([item]),{...headers,Origin:'https://other.test'})).status,403);
         const out=await post('/session/export-hwpx',W.bundle([item]));assert.equal(out.status,200);assert.equal(out.headers.get('Content-Type'),'application/hwp+zip');assert.equal(await out.text(),'PK-fixture');assert.equal(count,1);
         assert.equal((await post('/session/export-hwpx',W.bundle([{...item,result:{...sample(),request_id:'REQ-other'}}]))).status,400);assert.equal(count,1);
         const body={...item,provider:'gemini'};assert.equal((await post('/session/import-result',body)).status,201);assert.equal((await post('/session/import-result',body)).status,200);
         assert.equal((await post('/session/import-result',{...body,result:{...sample(),answer:'different'}})).status,409);
         const saved=await(await fetch(base+'/session/jobs/'+job.request_id,{headers})).json();assert.equal(saved.provider,'gemini');assert.equal(saved.output.validation.human_approval,false);
         assert.equal((await post('/session/import-result',{...body,provider:'invented'})).status,400);
        }finally{app.closeAllConnections();await new Promise(r=>app.close(r));assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('pa-handoff-test-'));fs.rmSync(folder,{recursive:true,force:true});}
        """)

    def test_public_build_only_includes_web_code_not_private_exports(self):
        from prepare_pages import STATIC_FILES, STATIC_DIRS
        self.assertIn('web-handoff.js', STATIC_FILES)
        self.assertIn('production-io.js', STATIC_FILES)
        self.assertNotIn('server', STATIC_DIRS)
        self.assertNotIn('.pa-session', STATIC_DIRS)


SKILLS = Path(os.environ.get('PA_MATH_SKILLS', str(Path.home()/'.codex/skills')))
KIT_PRESENT = (SKILLS/'math-ocr-hwpx/scripts/equation_bridge.py').exists()


@unittest.skipUnless(KIT_PRESENT, 'Native-math authoring kit is a local export dependency')
class HwpxTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location('pa_export_hwpx', ROOT/'server/export_hwpx.py')
        cls.module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    def test_native_equations_notes_numbering_and_document_boundary(self):
        item={'question':['함수 $f(x)=\\frac{x^2+1}{2}$와 $0\\le x\\le 2$에 대하여 값을 구하시오.'], 'answer':'1/2', 'solution':['$\\binom{5}{2}=10$이고, $x=0$ 또는 $x=2$이다.']}
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
            output=Path(folder)/'sample.hwpx'
            metrics=self.module.build([item,item],output,SKILLS)
            with zipfile.ZipFile(output) as archive:
                self.assertIsNone(archive.testzip())
                root=ET.fromstring(archive.read('Contents/section0.xml'))
            hp='{http://www.hancom.co.kr/hwpml/2011/paragraph}'
            notes=list(root.iter(hp+'endNote'))
            self.assertEqual([n.get('number') for n in notes],['1','2'])
            self.assertGreater(metrics['equations'],8)
            self.assertEqual(root[-1].get('pageBreak'),'1')
            self.assertEqual(sum(p.get('columnBreak')=='1' for p in root),1)
            for note in notes:
                plain=''.join(t.text or '' for t in note.iter(hp+'t'))
                self.assertIn('[정답]',plain)
                self.assertNotIn('1/2',plain)
                self.assertTrue(list(note.iter(hp+'equation')))
            scripts=' '.join(t.text or '' for t in root.iter(hp+'script'))
            self.assertIn('over',scripts)
            self.assertNotIn('binom',scripts)
            self.assertIn('C',scripts)

    def test_multiline_math_and_plain_korean_between_equations(self):
        item={'question':['방정식 $$\nx^2=1\n$$의 해를 구하시오.'], 'answer':'$\\pm 1$', 'solution':['$x=1\\quad\\text{또는}\\quad x=-1$이다.']}
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
            out=Path(folder)/'test.hwpx';self.module.build([item],out,SKILLS)
            with zipfile.ZipFile(out) as z:
                xml=z.read('Contents/section0.xml').decode()
            self.assertIn(' 또는 ',xml)
            self.assertNotIn('quad',xml)

    def test_observed_short_fraction_and_integral_spacing_regression(self):
        item={'question':[r'$\int_a^x(t^2+1)\,dt$를 계산하시오.'], 'answer':'1',
              'solution':[r'$x^2+ax+a^2=\left(x+\frac a2\right)^2+\frac{3a^2}{4}\ge 0$']}
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
            out=Path(folder)/'real-syntax.hwpx';self.module.build([item],out,SKILLS)
            with zipfile.ZipFile(out) as z:
                root=ET.fromstring(z.read('Contents/section0.xml'))
            hp='{http://www.hancom.co.kr/hwpml/2011/paragraph}'
            scripts=' '.join(x.text or '' for x in root.iter(hp+'script'))
            self.assertEqual(scripts.count('over'),2)
            self.assertNotIn('frac',scripts)
            self.assertNotIn(',', ''.join(x.text or '' for x in root.iter(hp+'t')))
            self.assertEqual(self.module.explicit_fractions(r'\frac12+\frac{1}{\frac a2}'),r'\frac{1}{2}+\frac{1}{\frac{a}{2}}')

    def test_corrupt_latex_and_external_commands_fail_without_repair(self):
        for question in ['손상된 $x=1', '$x\x0crac{1}{2}$', '$\\includegraphics{secret.png}$']:
            with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
                out=Path(folder)/'fail.hwpx'
                with self.assertRaises(ValueError):
                    self.module.build([{'question':[question],'answer':'1','solution':['계산한다.']}],out,SKILLS)
                self.assertFalse(out.exists())


if __name__=='__main__':
    unittest.main()
