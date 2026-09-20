"""Display examples: math, rendering, and isolation from production conditions."""
import unittest
import sympy as sp
from test_model import run_js


class BoxExampleTests(unittest.TestCase):
    def test_all_materials_and_bundles_have_renderable_worked_examples(self):
        run_js(r"""
        const X=require('./box-examples.js'),B=require('./judgment-bundles.js'),K=require('./vendor/katex/katex.min.js');
        const ids=[...R.operations.map(o=>o.id),...B.catalog.map(b=>b.id)];
        assert.deepEqual(Object.keys(X.records).sort(),ids.sort());
        for(const id of ids){const row=X.get(id);assert.ok(row.given.includes('$'));assert.ok(row.steps.length>=2);assert.ok(row.result);
          if(row.source){assert.ok(row.original);assert.ok(row.name);}
          for(const text of [row.given,...row.steps,row.result]){
            assert.equal((text.match(/\$/g)||[]).length%2,0,id);
            for(const m of text.matchAll(/\$([^$]+)\$/g))K.renderToString(m[1],{throwOnError:true,trust:false});
          }
        }
        """)

    def test_examples_do_not_add_conditions_or_change_material_ids(self):
        run_js(r"""
        const B=require('./judgment-bundles.js'),P=require('./composition-planner.js'),U=require('./curriculum-model.js');
        const seed=B.seed(R,'sign-cases'),target=P.targets(seed.plan,R,seed.coreId)[0].target;
        const spec={...P.intent(seed.plan,R,seed.coreId,target,0,1),curriculum_scope:U.scope('m2-integrals')};
        const before=C.makeRequest(R,seed.plan,'검증','EXAMPLE-ISOLATION',spec);
        const X=require('./box-examples.js');
        X.records['sign-cases'].given='DISPLAY-ONLY-CHANGED-NUMBERS';
        const after=C.makeRequest(R,seed.plan,'검증','EXAMPLE-ISOLATION',spec);
        assert.deepEqual(after,before);
        assert.equal(X.get('PA-MOTIF-S01-04').name,'연속 함수는 혼자두고 분석하자');
        assert.equal(X.get('PA-S02-RECURRENCE-02').name,'피적분함수의 평행이동과 적분구간의 이동');
        """)

    def test_worked_math_at_boundaries_tangencies_and_shifted_integrals(self):
        x,t,b=sp.symbols('x t b', real=True)
        F=x*(x-2)**2/4
        self.assertEqual(sp.factor(F-x), x**2*(x-4)/4)
        self.assertEqual(sp.expand(F-x+2-(x-2)*(x*x-2*x-4)/4),0)
        answers={0,4,2,1-sp.sqrt(5),1+sp.sqrt(5)}
        self.assertEqual(len(answers),5)
        for value in answers:
            self.assertEqual(sp.simplify(F.subs(x,value-F.subs(x,value))),0)
        self.assertEqual(sp.integrate(t*t+t+1,(t,0,1)),sp.Rational(11,6))
        self.assertEqual(sp.solve([b-(-b)],[b]),{b:0})
        # The signed absolute-value example is smooth at 0 and has a corner at 1.
        left=x*(1-x);right=x*(x-1)
        self.assertEqual(sp.diff(left,x).subs(x,0),1)
        self.assertEqual((sp.diff(left,x).subs(x,1),sp.diff(right,x).subs(x,1)),(-1,1))
        # At a=1 or 3 only one simple root remains; elsewhere all three are simple.
        for a,expected in [(1,[3]),(3,[1]),(2,[1,2,3])]:
            roots=sp.roots((x-1)*(x-3)*(x-a),x)
            self.assertEqual(sorted(r for r,m in roots.items() if m%2),expected)
        for k,n in [(-2,2),(-1,3),(0,3),(1,3),(2,2)]:
            self.assertEqual(len(set(sp.polys.polytools.intervals(x**3-3*x-k,eps=sp.Rational(1,100)))),n)


if __name__=='__main__':
    unittest.main()
