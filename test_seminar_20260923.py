"""Three source solutions, boundary mutations and real old/new joins.

Exact checks are independent of the port engine; no model calls or persisted dummy assets.
This suite does not certify arbitrary generated questions or empirical difficulty.
"""
import copy
import json
import unittest
import sympy as S
from test_model import run_js
from test_connections import ROOT
from build_connections import build, validate_extension

x,k=S.symbols('x k',real=True)

def cubic_values(value):
    """Compute signed integrals and area separately from an exact antiderivative."""
    f=x*(x-1)*(x-value)
    cuts=sorted(set([S.Integer(0),S.Integer(1)]+([value] if 0<value<1 else [])))
    area=sum(abs(S.integrate(f,(x,a,b))) for a,b in zip(cuts,cuts[1:]))
    return S.integrate(f,(x,0,1))-area,S.integrate(f,(x,-1,0))-area

def intersection_count(poly,slope,height):
    left=S.Poly(poly+slope*x-height,x).real_roots(multiple=False)
    right=S.Poly(poly-slope*x-height,x).real_roots(multiple=False)
    return sum(bool(r<0) for r,_ in left)+sum(bool(r>=0) for r,_ in right)

class Seminar20260923Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.registry=build()

    def test_signed_integral_identities_and_all_three_claims(self):
        f=x*(x-1)*(x-k)
        # This exact identity proves the thresholds on the entire k<0 region.
        self.assertEqual(S.expand(S.integrate(f,(x,-1,1))+2*(k+1)/3),0)
        self.assertEqual(S.expand(2*S.integrate(f,(x,0,1))-(2*k-1)/6),0)
        for value in [S.Rational(j,4) for j in range(-40,41)]:
            g0,gm=cubic_values(value)
            self.assertLessEqual(g0,0)
            self.assertEqual(g0==0,value>=1)
            self.assertEqual(gm>0,value<-1)
            self.assertEqual(gm>1,value<S.Rational(-5,2))
            if g0==0:self.assertLess(gm,0)  # ㄱ
            if gm>0:self.assertLess(value,-1)  # ㄴ, not the converse of ㄱ
            if gm>1:self.assertLess(g0,-1)  # ㄷ
        # Original table bug and strict endpoints must not return.
        for value in [S.Integer(1),S.Integer(2)]:self.assertEqual(cubic_values(value)[0],0)
        self.assertEqual(cubic_values(S.Rational(-5,2)),(-1,1))
        self.assertEqual(cubic_values(S.Integer(-1))[1],0)

    def test_positive_integral_is_not_pointwise_positive(self):
        f=x-S.Rational(1,4)
        self.assertGreater(S.integrate(f,(x,0,1)),0)
        self.assertLess(f.subs(x,0),0)
        # Forward orientation is essential for the sign claim.
        self.assertEqual(S.integrate(x,(x,1,-1))-S.integrate(S.Abs(x),(x,1,-1)),1)

    def test_v_graph_count_tangent_domain_and_split_area(self):
        f=x**3+x*x-x
        self.assertEqual(S.factor(f+4*x+3),(x+1)*(x*x+3))
        self.assertEqual(S.factor(f-4*x+3),(x-1)**2*(x+3))
        self.assertEqual(S.solve(S.diff(f,x)-4,x),[-S.Rational(5,3),1])
        self.assertEqual(S.discriminant(3*x*x+2*x+3,x),-32)
        for height,count in [(-5,1),(-3,2),(-2,3),(0,2)]:
            self.assertEqual(intersection_count(f,4,height),count)
        # At k=0 there are also two intersections, but no tangency: k<0 matters.
        self.assertNotEqual(S.diff(f-4*x,x).subs(x,-S.Rational(1,2)+S.sqrt(21)/2),0)
        left=S.integrate(f+4*x+3,(x,-1,0));right=S.integrate(f-4*x+3,(x,0,1))
        self.assertEqual((left,right),(S.Rational(19,12),S.Rational(13,12)))
        self.assertEqual(30*(left+right),80)
        self.assertNotEqual(S.integrate(f-4*x+3,(x,-1,1)),left+right)

    def test_scaled_shifted_v_families_and_old_derivative_bridge(self):
        for scale in [S.Rational(1,2),1,2,3]:
            for offset in [-2,0,5]:
                f=scale*(x**3+x*x-x)+offset
                height=offset-3*scale
                self.assertEqual(intersection_count(f,4*scale,height),2)
                self.assertEqual(intersection_count(f,4*scale,height-scale),1)
                self.assertEqual(intersection_count(f,4*scale,height+scale),3)
                area=S.integrate(f+4*scale*x-height,(x,-1,0))+S.integrate(f-4*scale*x-height,(x,0,1))
                self.assertEqual(area,S.Rational(8,3)*scale)
        # Recombination A: the old derivative+anchor box feeds the new V comparison.
        f=S.integrate(6*x*x+4*x-2,x)+5
        self.assertEqual(f,2*x**3+2*x*x-2*x+5)
        self.assertEqual(intersection_count(f,8,-1),2)
        self.assertEqual(3*(S.integrate(f+8*x+1,(x,-1,0))+S.integrate(f-8*x+1,(x,0,1))),16)
        # Recombination B: integral reasoning feeds the old integer-selection box.
        admissible=[a for a in range(-4,1) if cubic_values(S.Integer(a))[1]>1]
        self.assertEqual(admissible,[-4,-3]);self.assertEqual(sum(admissible),-7)

    def test_right_left_endpoint_ownership_and_overlap_mutation(self):
        # Scaled original family: g=x outside [-a,a], f=-b(x+a)-c inside.
        # a,c>0,b>=0 -> f<0 and decreasing, h' = f + (x+2a)f' < 0.
        a,b,c=S.symbols('a b c',positive=True)
        f=-b*(x+a)-c
        h=f*(x+2*a)
        self.assertEqual(S.expand(S.diff(h,x)), -2*b*x-3*a*b-c)
        self.assertEqual(S.diff(h,x).subs(x,-a),-a*b-c)
        self.assertEqual(S.expand(h.subs(x,a)+3*a*(2*a*b+c)),0)
        # Constant f (non-increasing interpretation) is still strictly decreasing in h.
        self.assertEqual(S.diff(h.subs(b,0),x),-c)
        for av in [1,2,3]:
            fv=-x-av-2; hv=fv*(x+2*av)
            infimum=hv.subs(x,av)
            self.assertLess(infimum,0)
            self.assertGreater(3*av*av,infimum) # actual value at x=a for right limits
            self.assertEqual(S.limit(hv,x,av,dir='-'),infimum)
            self.assertLess(S.diff(hv,x).subs(x,-av),0)
            # Left limits include x=a instead, so the same candidate is attained.
            self.assertEqual(fv.subs(x,av)*(3*av),infimum)
        # Changing shift from 2 to 1 creates an overlap; the old four pieces fail.
        fv=-x-3
        point=-S.Rational(1,2)
        actual=(fv*fv.subs(x,x+1)).subs(x,point)
        old_piece=(fv*(x+1)).subs(x,point)
        self.assertEqual(actual,S.Rational(35,4));self.assertNotEqual(actual,old_piece)

    def test_all_continuity_boundaries_and_original_answer(self):
        u,v=S.symbols('u v',real=True)
        # right-limit pieces at -3,-1,1: left limit, right/actual value
        pairs=[(3,-3*u),(-v,u),(3*v,3)]
        self.assertEqual(S.solve([a-b for a,b in pairs],(u,v)),{u:-1,v:1})
        self.assertFalse(all(S.simplify(a.subs({u:-2,v:-4})-b.subs({u:-2,v:-4}))==0
                             for a,b in [(S.sympify(a),S.sympify(b)) for a,b in pairs]))
        # Explicit counterexample to automatic continuity, f=x-1.
        self.assertEqual(((x-1)*(x+2)).subs(x,1),0)
        self.assertNotEqual(0,3)

    def test_intake_provenance_candidates_and_review_visibility(self):
        ext=json.loads((ROOT/'connection-incoming/seminar-20260923.json').read_text(encoding='utf-8'))
        self.assertEqual(len(ext['operations']),11)
        self.assertEqual(len([r for r in ext['records'] if r['kind']=='seminar_source']),3)
        self.assertTrue(all(r['source_status']=='ai_candidate' for r in ext['records']))
        self.assertTrue(all(o['review_status']=='ai_candidate' for o in ext['operations']))
        self.assertEqual({r['kind'] for r in ext['records']},{'seminar_source','concept','skill','decision','problem_pattern','strategy'})
        self.assertTrue(all(r.get('reviewers')==[] for r in ext['records']))
        sources=[r for r in ext['records'] if r['kind']=='seminar_source']
        self.assertTrue(all(r['provenance']['official_identity']=='unverified_filename_metadata' for r in sources))
        self.assertFalse(sources[2]['provenance']['independent_evidence'])
        run_js(r"""
        const Review=require('./review-model.js'),X=require('./box-examples.js'),U=require('./curriculum-model.js');
        const catalog=Review.catalog(R,require('./review-groups.json'),X);
        const added=R.operations.filter(o=>o.id.startsWith('PA-S03-'));
        assert.equal(added.length,11);
        for(const op of added){assert.ok(catalog.groups.some(g=>g.operations.includes(op.id)));assert.ok(U.classifications[op.id]);assert.ok(X.get(op.id).source);}
        assert.deepEqual(Review.assets(R,catalog,{groups:[]}),[]);
        """)

    def test_old_new_bundles_and_model_verification_contract(self):
        run_js(r"""
        const B=require('./judgment-bundles.js'),Planner=require('./composition-planner.js');
        const w=require('./source-witnesses.json').witnesses.find(w=>w.source_question_id==='SEMINAR-20260923-KIM_YEONSU');
        const facts=w.facts.map(f=>({...f,origin:'given',scope:'main'})).filter(f=>f.type!=='polynomial_known');
        for(const type of ['derivative_known','anchor_value','nonzero_derivative','polynomial'])facts.push({type,subject:'H',scope:'main',origin:'given'});
        const nodes=[{id:'PA-BRIDGE-04',bindings:{f:'H',h:'F',a:'a'},scope:'main'},...w.nodes];
        const p={revision:R.revision,facts,nodes};assert.equal(E.run(p).status,'connected');
        const a=Planner.analyze(p,R,'PA-BRIDGE-04',{type:'area_result',subject:'F',scope:'main'});
        assert.ok(a.ready,JSON.stringify(a.issues));assert.deepEqual(a.unused,[]);
        const request=C.makeRequest(R,p,'도함수와 한 점에서 출발해 교점 조건과 넓이를 연결','S03-RC');
        assert.equal(request.execution.composer,'model');
        assert.ok(request.instructions.includes('실제 최솟값'));
        assert.ok(request.knowledge.operations.find(o=>o.id==='PA-S03-V-02').verification.required_checks.includes('two_intersections_not_automatic_tangency'));
        for(const id of ['signed-area-roots','count-to-area','limit-to-minimum']){const s=B.seed(R,id);assert.equal(E.run(s.plan).status,'connected');assert.equal(B.groups(s.plan,R)[0].id,id);}
        const integers=B.seed(R,'signed-area-roots').plan;
        integers.nodes.push({id:'PA-S02-LEVELS-03',bindings:{f:'F',h:'H',a:'a'},scope:'main'});
        assert.ok(E.run(integers).facts.some(f=>f.type==='integer_answer'&&f.subject==='a'));
        """)

    def test_wrong_scope_object_direction_and_missing_premises_are_rejected(self):
        run_js(r"""
        const B=require('./judgment-bundles.js');
        for(const id of ['PA-S03-V-01','PA-S03-LIMIT-01','PA-S03-LIMIT-03']){
          const p=B.seed(R,id).plan,aliased=structuredClone(p);aliased.nodes[0].bindings.h='F';
          assert.equal(E.run(aliased).status,'blocked',id+' alias');
          for(let i=0;i<p.facts.length;i++)assert.notEqual(E.run({...p,facts:p.facts.filter((_,j)=>i!==j)}).status,'connected',id+' missing');
          const wrong=structuredClone(p);wrong.facts[0].object='OTHER';assert.notEqual(E.run(wrong).status,'connected');
        }
        const r=B.seed(R,'PA-S03-LIMIT-01').plan;
        r.facts.push({type:'left_limit_product',subject:'F',object:'H',origin:'given',scope:'main'});
        assert.equal(E.run(r).status,'blocked','opposite direction must require rewriting');
        const p=B.seed(R,'limit-to-minimum').plan;
        const result=E.run(p);const final=p.nodes.at(-1);
        const bad=result.facts.filter(f=>f.type!=='minimum_result').map(f=>f.type==='boundary_limits'?{...f,scope:'other-claim'}:f);
        assert.equal(E.inspect(bad,final).status,'conditional','different claim cannot donate a boundary');
        const area=B.seed(R,'PA-S03-AREA-02').plan;
        area.facts.push({type:'negative_interval_sample',subject:'F',scope:'main',origin:'given'});
        assert.equal(E.run(area).status,'blocked');
        const two=[{type:'requested_count',subject:'F',scope:'main',origin:'given'}];
        assert.notEqual(E.inspect(two,{id:'PA-S03-V-02',bindings:{f:'F',a:'a'},scope:'main'}).status,'direct');
        """)

    def test_distinct_binding_validation(self):
        ext=json.loads((ROOT/'connection-incoming/seminar-20260923.json').read_text(encoding='utf-8'))
        op=next(o for o in ext['operations'] if o['id']=='PA-S03-V-01')
        known_records={r['id'] for r in self.registry['records']}-{r['id'] for r in ext['records']}
        known_ops={o['id'] for o in self.registry['operations']}-{o['id'] for o in ext['operations']}
        validate_extension(ext,known_records,known_ops,self.registry['types'])
        for bad in [[['f','f']],[['f','unknown']],['f','h'],[['f',[]]]]:
            changed=copy.deepcopy(ext);next(o for o in changed['operations'] if o['id']==op['id'])['distinct_bindings']=bad
            with self.assertRaises(ValueError):validate_extension(changed,known_records,known_ops,self.registry['types'])

    def test_witness_scopes_and_content_dependent_cache(self):
        run_js(r"""
        const P=require('./design-planner.js'),W=require('./source-witnesses.json');
        const w=structuredClone(W.witnesses.find(w=>w.source_question_id==='SEMINAR-20260923-MIN_JAEWOONG'));
        w.facts.forEach(f=>f.scope='claim-c');w.nodes.forEach(n=>n.scope='claim-c');w.goals.forEach(g=>g.scope='claim-c');
        const t=P.templates(R,{...W,witnesses:[w]})[0];
        assert.ok(t.goals.every(g=>g.scope==='claim-c'));
        assert.ok(P.analyze(t,R,E).connected);
        const populated=P.fused(R,W,E);
        const onlyPresets=P.fused(R,{...W,witnesses:[]},E);
        assert.notDeepEqual(populated.map(t=>t.id),onlyPresets.map(t=>t.id),'witness edits invalidate cache');
        """)

if __name__=='__main__':unittest.main()
