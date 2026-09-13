"""Independent symbolic regression against the actual JavaScript browser engine."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path
import sympy as s

ROOT=Path(__file__).resolve().parent

class ComposerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        node=shutil.which('node') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')
        cls.rows=json.loads(subprocess.check_output([node,str(ROOT/'composer-engine.js')],text=True,encoding='utf-8'))

    def test_all_option_combinations_and_answers(self):
        x,t,a=s.symbols('x t a',real=True)
        self.assertEqual(len(self.rows),120)
        for row in self.rows:
            with self.subTest(options=row['options']):
                p=row['parameters'];r,v,b,m=p['r'],p['s'],p['b'],p['m']
                F=2*x**3+p['A']*x*x+p['B']*x
                G=s.integrate((F-F.subs(x,t))*((t-b)**2+1),(t,a,x));D=s.diff(G,x)
                self.assertEqual(s.expand(D-s.diff(F,x)*s.integrate((t-b)**2+1,(t,a,x))),0)
                for av,count in [(r-1,3),(r,1),(m,3),(v,1),(v+1,3)]:
                    self.assertEqual(sum(n%2 for _,n in s.Poly(D.subs(a,av),x).intervals()),count)
                valid=[av for av in [r,v] if not row['options']['selectCandidate'] or D.subs({x:m,a:av})<0]
                self.assertEqual(valid,row['answer'])
                # Removing the count-of-extrema condition leaves multiple allowed a.
                self.assertLess(D.subs({x:m,a:r-1}),0)
                self.assertLess(D.subs({x:m,a:r-2}),0)
                u,c=s.symbols('u c')
                self.assertEqual(s.solve([c-6*r*v,6+u+c-6*(1-r)*(1-v)],(u,c)),{u:2*p['A'],c:p['B']})

    def test_selected_blocks_change_actual_question_and_plan(self):
        rows={(r['options']['presentation'],r['options']['inferSign'],r['options']['selectCandidate'],r['options']['seed']):r for r in self.rows}
        for seed in {r['options']['seed'] for r in self.rows}:
            basic=rows['factored',False,False,seed]
            more=rows['factored',True,True,seed]
            hidden=rows['conditions',False,False,seed]
            self.assertEqual(len(basic['answer']),2);self.assertEqual(len(more['answer']),1)
            self.assertEqual(len(more['discoveries'])-len(basic['discoveries']),2)
            self.assertEqual(basic['work']['definiteIntegralEvaluations'],0)
            self.assertEqual(more['work']['definiteIntegralEvaluations'],0)
            self.assertEqual(hidden['answer'],basic['answer'])
            self.assertEqual(hidden['work']['coefficientDeterminations'],2)
            self.assertNotEqual(basic['question'],hidden['question'])
            self.assertTrue(any('풀이 도움' in q for q in basic['question']))
            self.assertFalse(any('풀이 도움' in q for q in more['question']))
            self.assertFalse(any('F(0)' in q for q in hidden['question']))

if __name__=='__main__':unittest.main()
