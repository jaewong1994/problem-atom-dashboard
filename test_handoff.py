"""Web handoff/import/export boundaries. Model fixtures remain temporary."""
from test_model import run_js
from test_connections import ROOT
import importlib.util
import os
import re
from pathlib import Path
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET


class HandoffTests(unittest.TestCase):
    def test_web_prompt_preserves_selected_plan_and_uses_no_other_provider(self):
        run_js(r"""
        const W=require('./web-handoff.js'),text=W.prompt(job,'gemini');
        for(const provider of ['gemini','chatgpt','claude'])assert.ok(W.prompt(job,provider).includes(C.SOLUTION_GUIDANCE));
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

    def test_roman_case_labels_share_one_native_style(self):
        variants = [r'$\text{(I)}\quad F(x)=x$', r'$\mathrm{(I)}\quad F(x)=x$',
                    r'$(\mathrm{I})\quad F(x)=x$', '(I) $F(x)=x$', '(Ⅰ) $F(x)=x$', '(ⅰ) $F(x)=x$']
        hp = '{http://www.hancom.co.kr/hwpml/2011/paragraph}'
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-case-') as folder:
            for i, question in enumerate(variants):
                output = Path(folder)/f'{i}.hwpx'
                self.module.build([{'question':[question], 'answer':'1',
                                    'solution':[r'(II)에서 $G(x)=x$이다.', r'$\text{(II)}\quad G(x)=x$']}], output, SKILLS)
                with zipfile.ZipFile(output) as z:
                    root = ET.fromstring(z.read('Contents/section0.xml'))
                scripts = [n.text for n in root.iter(hp+'script')]
                self.assertEqual(sum(s.startswith('LEFT ( rm I it RIGHT )') for s in scripts), 1)
                self.assertEqual(sum(s.startswith('LEFT ( rm II it RIGHT )') for s in scripts), 2)
                self.assertTrue(any(s.startswith('LEFT ( rm I it RIGHT ) ~ rm F it') for s in scripts))
                self.assertFalse(any('"(I)"' in s or '"(II)"' in s or 'Ⅰ' in s or 'Ⅱ' in s for s in scripts))
                self.assertFalse(any(re.search(r'\([ⅠⅡIV]+\)', n.text or '') for n in root.iter(hp+'t')))
                for run in root.iter(hp+'run'):
                    children=list(run)
                    for j,node in enumerate(children):
                        if node.tag==hp+'equation' and any('rm I' in (s.text or '') for s in node.iter(hp+'script')):
                            # A declaration stays with its formula; references
                            # use the same marker followed by ordinary spacing.
                            self.assertTrue(any(' ~ ' in (s.text or '') for s in node.iter(hp+'script'))
                                            or any(n.tag==hp+'t' and n.text==' ' for n in children[j+1:]))

    def test_case_projection_keeps_math_arguments_and_punctuation(self):
        split = self.module.split_case_labels
        for source in [r'F(I)+G(II)', r'\frac{(I)}{x}', r'\begin{cases}x & (I)\\0 & (II)\end{cases}']:
            self.assertEqual(split('math',source), [('math',source)])
        self.assertEqual(split('text','함수 F(I)를 구한다.'), [('text','함수 F(I)를 구한다.')])
        item={'question':[r'$\text{(I)}\quad F(x)=x,\qquad\text{(II)}\quad G(x)=x^2$'],
              'answer':'1','solution':['(Ⅰ)과 (Ⅱ)를 비교한다.']}
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-case-') as folder:
            output=Path(folder)/'comma.hwpx'
            self.module.build([item],output,SKILLS)
            with zipfile.ZipFile(output) as z:
                root=ET.fromstring(z.read('Contents/section0.xml'))
            hp='{http://www.hancom.co.kr/hwpml/2011/paragraph}'
            self.assertIn(', ',[n.text for n in root.iter(hp+'t')])

    def test_uppercase_functions_are_upright_without_romanizing_arguments(self):
        item={'question':[r"$F(x)+G_a(x)+H_2'(x)+Q(x)+F$와 $f(x)+g(t)$를 비교한다."],
              'answer':'0','solution':[r"$F'(x)+G(x)+H(x)$이다."]}
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-font-') as folder:
            output=Path(folder)/'font.hwpx'
            self.module.build([item],output,SKILLS)
            with zipfile.ZipFile(output) as z:
                root=ET.fromstring(z.read('Contents/section0.xml'))
            hp='{http://www.hancom.co.kr/hwpml/2011/paragraph}'
            scripts='\n'.join(n.text or '' for n in root.iter(hp+'script'))
            for letter in ['F','G','H','Q']:
                self.assertIn('rm '+letter+' it',scripts)
            self.assertIn("rm F' it",scripts)
            self.assertIn('rm G it_{a}',scripts.replace('it _','it_'))
            self.assertNotIn('rm{',scripts)
            for letter in ['x','a','f','g','t']:
                self.assertNotRegex(scripts,r'\brm\s+'+letter+r'\b')

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
            self.assertEqual(self.module.prepare_latex(r'\frac12+\frac{1}{\frac a2}'),r'\frac{1}{2}+\frac{1}{\frac{a}{2}}')

    def test_corrupt_latex_and_external_commands_fail_without_repair(self):
        for question in ['손상된 $x=1', '$x\x0crac{1}{2}$', '$\\includegraphics{secret.png}$']:
            with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
                out=Path(folder)/'fail.hwpx'
                with self.assertRaises(ValueError):
                    self.module.build([{'question':[question],'answer':'1','solution':['계산한다.']}],out,SKILLS)
                self.assertFalse(out.exists())

    def test_observed_displaystyle_number_set_and_short_roots_in_body_and_notes(self):
        formula = r'J_a(x)=\displaystyle\int_a^x(t^2+1)\,dt\quad(x\in\mathbb{R})'
        item = {'question': ['$' + formula + '$'], 'answer': r'$\sqrt2$',
                'solution': [r"$G_a'(x)=3(x-1)(x-\sqrt2)J_a(x)$", '$' + formula + '$']}
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
            out = Path(folder)/'observed.hwpx'
            self.module.build([item], out, SKILLS)
            with zipfile.ZipFile(out) as z:
                root = ET.fromstring(z.read('Contents/section0.xml'))
            hp = '{http://www.hancom.co.kr/hwpml/2011/paragraph}'
            scripts = [e.text or '' for e in root.iter(hp+'script')]
            joined = ' '.join(scripts)
            self.assertEqual(len(re.findall(r'\bint\s*_', joined)), 2)
            self.assertIn('sqrt {2}', joined)
            self.assertIn('rm R it', joined)
            self.assertFalse(any(word in joined for word in ['displaystyle', 'mathbb', 'sqrt2']))
            note = next(root.iter(hp+'endNote'))
            self.assertRegex(' '.join(e.text or '' for e in note.iter(hp+'script')), r'\bint\s*_')

    def test_tex_arguments_and_known_command_boundaries(self):
        prep = self.module.prepare_latex
        self.assertEqual(prep(r'\sqrt2x+\frac a2'), r'\sqrt{2}x+\frac{a}{2}')
        self.assertEqual(prep(r'x^2y+a_12'), 'x^{2} y+a_{1} 2')
        self.assertIn(r'\sqrt[3]{\frac{1}{2}}', prep(r'\sqrt[3]{\frac12}'))
        self.assertIn(r'\lim ', prep(r'\lim\limits_{x\to0+}f(x)'))

    def test_unknown_or_malformed_macros_never_become_printed_words(self):
        for formula in [r'\intentionally_a^x f(t)dt', r'\sqrttwo',
                        r'\mathbb{F}', r'\sqrt', r'\frac{1}',
                        r'\sqrt{2', r'x^', r'\begin{aligned}x&=1\end{aligned}']:
            with self.subTest(formula=formula), tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
                out = Path(folder)/'fail.hwpx'
                with self.assertRaises(ValueError):
                    self.module.build([{'question':['$'+formula+'$'],'answer':'1','solution':['계산한다.']}],out,SKILLS)
                self.assertFalse(out.exists())

    def test_observed_escape_noise_exports_identically_without_changing_source(self):
        clean = {'question':[r'$F(x)=-\frac49x(x-3)^2$이다.'], 'answer':'$-16$',
                 'solution':[r'$F_2(\frac r2)=-\frac r2,$', r"$F_1'(1)=\frac43,\qquad F_2'(1)=0.$"]}
        noisy = {'question':['\x1b[31m'+clean['question'][0]+'\x1b[0m'],
                 'answer':clean['answer'],
                 'solution':[s.replace(',', ',\x1b') for s in clean['solution']]}
        original = repr(noisy)
        with tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
            files = [Path(folder)/name for name in ['clean.hwpx','noisy.hwpx']]
            for item, out in zip([clean,noisy], files):
                self.module.build([item],out,SKILLS)
            with zipfile.ZipFile(files[0]) as a, zipfile.ZipFile(files[1]) as b:
                self.assertEqual(a.read('Contents/section0.xml'), b.read('Contents/section0.xml'))
        self.assertEqual(repr(noisy), original)

    def test_ambiguous_controls_report_the_exact_problem_and_paragraph(self):
        for bad in ['$x\x0crac{1}{2}$', '$\x08inom{5}{2}$', '$x\x1b[2J$']:
            with self.subTest(bad=repr(bad)), tempfile.TemporaryDirectory(prefix='pa-hwpx-test-') as folder:
                good = {'question':['$x=1$이다.'],'answer':'1','solution':['계산한다.']}
                item = {**good,'solution':['첫 단계',bad]}
                out = Path(folder)/'bad.hwpx'
                with self.assertRaisesRegex(ValueError,'2번 문항 해설 2번째 문단'):
                    self.module.build([good,item],out,SKILLS)
                self.assertFalse(out.exists())


if __name__=='__main__':
    unittest.main()
