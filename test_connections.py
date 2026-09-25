"""Connection semantics + independent polynomial witnesses (no generated assets persisted)."""
import copy
import json
import shutil
import subprocess
import unittest
from pathlib import Path
import sympy as S
from build_connections import build, validate_extension, source_digest

ROOT=Path(__file__).resolve().parent
NODE=shutil.which('node') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')

def js(source):
    prefix="const R=require('./connection-registry.json');const E=require('./connection-engine.js').create(R);const assert=require('node:assert/strict');"
    return subprocess.check_output([NODE,'-e',prefix+source],cwd=ROOT,encoding='utf-8')

class ConnectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.registry=build()

    def test_complete_source_inventory_and_determinism(self):
        r=self.registry
        self.assertGreaterEqual(len(r['records']),107)
        self.assertGreaterEqual(len(r['operations']),43)
        self.assertEqual(r['revision'],build()['revision'])
        old={x['id'] for x in json.loads((ROOT/'asset-library.json').read_text(encoding='utf-8'))['reviewQueue'] if x['kind']!='question'}
        ids={x['id'] for x in r['records']}
        self.assertTrue(old<=ids)
        self.assertTrue(all(set(o['supports'])<=ids for o in r['operations']))
        self.assertTrue(all(o['review_status']=='ai_candidate' for o in r['operations']))
        self.assertNotIn('C:/',json.dumps(r))
        self.assertNotIn('C:\\',json.dumps(r))

    def test_registry_sources_survive_windows_linux_line_endings(self):
        import tempfile
        with tempfile.TemporaryDirectory(prefix='pa-regression-') as folder:
            a,b=Path(folder)/'unix.json',Path(folder)/'windows.json'
            payload='{"가": 1,\n "나": [2,3]}\n'
            a.write_bytes(payload.encode('utf-8'));b.write_bytes(payload.replace('\n','\r\n').encode('utf-8'))
            self.assertEqual(source_digest(a),source_digest(b))

    def test_every_contract_and_every_missing_requirement(self):
        js("""
        for(const op of R.operations){
          const node={id:op.id,bindings:{f:'F',h:'H',a:'a'},scope:'main'};
          const givens=op.requires.map(p=>({type:p.type,subject:node.bindings[p.subject.slice(1)],...(p.object?{object:node.bindings[p.object.slice(1)]}:{}),scope:'main',origin:'given'}));
          assert.equal(E.inspect(givens,node).status,'direct',op.id);
          for(let i=0;i<givens.length;i++){
            const absent=givens.filter((_,j)=>j!==i);
            assert.notEqual(E.inspect(absent,node).status,'direct',op.id+' missing '+givens[i].type);
            assert.deepEqual(E.apply(absent,node).facts,absent,'failed nodes must not leak outputs');
          }
          for(const port of op.forbids){
            const blocked=[...givens,{type:port.type,subject:node.bindings[port.subject.slice(1)],...(port.object?{object:node.bindings[port.object.slice(1)]}:{}),scope:'main',origin:'given'}];
            assert.equal(E.inspect(blocked,node).status,'blocked');
          }
        }
        """)

    def test_cross_seminar_paths_and_bridge_discovery(self):
        js("""
        for(const p of R.presets){
          const plan=structuredClone(p);plan.revision=R.revision;
          assert.notEqual(E.run(plan).status,'connected');
          let state=E.prepare(plan.facts);
          for(let i=0;i<p.bridge_at;i++)state=E.apply(state,p.nodes[i]).facts;
          const found=E.suggest(state,p.nodes[p.bridge_at],{bindings:{f:'F',h:'H',a:'a'}});
          assert.equal(found.status,'bridge',p.id);
          const discovered=structuredClone(p);discovered.nodes.splice(p.bridge_at,0,...found.paths[0]);
          assert.equal(E.run(discovered).status,'connected',p.id+' auto route');
          plan.nodes.splice(p.bridge_at,0,...p.bridge_nodes);
          const res=E.run(plan);assert.equal(res.status,'connected',p.id);
          assert.equal(res.release_ready,false);
          for(let i=0;i<plan.facts.length;i++){
            const removed={...plan,facts:plan.facts.filter((_,j)=>j!==i)};
            assert.notEqual(E.run(removed).status,'connected',p.id+' missing '+plan.facts[i].type);
          }
        }
        """)

    def test_identity_scope_unknown_stale_and_forbidden_bindings(self):
        js("""
        const node={id:'PA-S02-LEVELS-03',bindings:{a:'a'},scope:'main'};
        const f={type:'admissible_set',subject:'a',scope:'main',origin:'given'};
        for(const altered of [{...f,subject:'b'},{...f,scope:'option-A'}])assert.equal(E.inspect([altered],node).status,'conditional');
        assert.equal(E.inspect([],{...node,id:'NOT-REGISTERED'}).status,'blocked');
        assert.throws(()=>E.run({facts:[],nodes:[],revision:'old'}));
        assert.throws(()=>E.run({facts:[{...f,origin:'derived'}],nodes:[node]}));
        assert.equal(E.inspect([],{id:'PA-BRIDGE-01',bindings:{f:'F',h:'F'},scope:'main'}).status,'blocked');
        assert.equal(E.inspect([{type:'distinct_roots',subject:'F',scope:'main',origin:'given'}],{id:'PA-MOTIF-S01-05',bindings:{f:'F'},scope:'main'}).status,'conditional');
        assert.equal(E.suggest([],{id:'PA-S02-LEVELS-03',bindings:{a:'a'},scope:'main'}).paths.length,0);
        // Concrete edge cases: constants and the zero polynomial cannot sneak into finite root analysis.
        const polynomial=[{type:'polynomial_known',subject:'F',scope:'main',origin:'given'}];
        assert.equal(E.inspect(polynomial,{id:'PA-BRIDGE-02',bindings:{f:'F'},scope:'main'}).status,'conditional');
        assert.equal(E.inspect(polynomial,{id:'PA-BRIDGE-06',bindings:{f:'F'},scope:'main'}).status,'conditional');
        const zeroScale=[{type:'zero_scale',subject:'F',scope:'main',origin:'given'}];
        assert.equal(E.inspect(zeroScale,{id:'PA-MOTIF-S01-10',bindings:{f:'F'},scope:'main'}).status,'blocked');
        const wrongRelation=[{type:'height_set',subject:'F',scope:'main',origin:'given'},{type:'height_identity',subject:'a',object:'G',scope:'main',origin:'given'}];
        assert.equal(E.inspect(wrongRelation,{id:'PA-BRIDGE-05',bindings:{f:'F',a:'a'},scope:'main'}).status,'conditional');
        const inverse=R.operations.find(o=>o.id==='PA-BRIDGE-09');
        const inverseNode={id:inverse.id,bindings:{f:'F',a:'a'},scope:'main'};
        const inverseFacts=inverse.requires.map(p=>({type:p.type,subject:inverseNode.bindings[p.subject.slice(1)],...(p.object?{object:'F'}:{}),scope:'main',origin:'given'}));
        assert.equal(E.inspect(inverseFacts,inverseNode).status,'direct');
        const unrelatedRoots=inverseFacts.map(f=>f.type==='parameter_is_critical_root'?{...f,object:'H'}:f);
        assert.equal(E.inspect(unrelatedRoots,inverseNode).status,'conditional','a different function cannot supply these roots');
        """)

    def test_all_pairs_are_only_discovery_not_approval(self):
        js("""
        for(const a of R.operations)for(const b of R.operations){
          const p=E.pair(a.id,b.id);
          assert.ok(['conditional','blocked','unrelated'].includes(p.status));
          if(p.status==='conditional')assert.ok(a.provides.some(x=>b.requires.some(y=>x.type===y.type)));
        }
        const p=structuredClone(R.presets[1]);p.nodes.splice(p.bridge_at,0,...p.bridge_nodes);
        const before=E.run(p);p.nodes.push(p.nodes[p.nodes.length-1]);const after=E.run(p);
        assert.equal(after.trace.at(-1).redundant,true);assert.deepEqual(after.work,before.work);
        """)

    def test_new_asset_ingestion_collision_and_unknown_quarantine(self):
        r=self.registry;rids={a['id'] for a in r['records']};oids={a['id'] for a in r['operations']}
        ext={'schema':'problem-atom/connection-extension/1','id':'regression-only','records':[{'id':'NEW-TEST','name':'임시 검사','kind':'skill','origin':'future-seminar','source_status':'ai_candidate'}],'operations':[]}
        validate_extension(ext,rids,oids,r['types']) # Reference-only records need not pretend to be executable.
        op=copy.deepcopy(r['operations'][0]);op.update(id='NEW-OP',supports=['NEW-TEST'])
        ext['operations']=[op];validate_extension(ext,rids,oids,r['types'])
        bad=copy.deepcopy(ext);bad['records'][0]['id']=next(iter(rids))
        with self.assertRaises(ValueError):validate_extension(bad,rids,oids,r['types'])
        bad=copy.deepcopy(ext);bad['operations'][0]['requires'][0]['type']='unregistered'
        with self.assertRaises(ValueError):validate_extension(bad,rids,oids,r['types'])
        bad=copy.deepcopy(ext);bad['operations'][0]['requires'][0]['subject']='$unsupported'
        with self.assertRaises(ValueError):validate_extension(bad,rids,oids,r['types'])
        bad=copy.deepcopy(ext);bad['operations'][0]['review_status']='approved'
        with self.assertRaises(ValueError):validate_extension(bad,rids,oids,r['types'])
        # New contracts become discoverable against old assets without a new family branch.
        js("""
        const r=structuredClone(R),base=r.operations.find(o=>o.id==='PA-BRIDGE-03');
        r.operations.push({...base,id:'NEW-OP'});const e=require('./connection-engine.js').create(r);
        assert.equal(e.pair('PA-MOTIF-S01-03','NEW-OP').status,'conditional');
        assert.equal(e.pair('NEW-OP','PA-S02-LEVELS-03').status,'conditional');
        """)

    def test_bridge_mathematics_and_counterexamples(self):
        x,t,a=S.symbols('x t a',real=True)
        # Affine shear: tilted lines to horizontal lines, across 60 distinct polynomials.
        for k in [1,2,-1]:
            for r in [-2,0,1,3]:
                for m in [-2,-1,1,2,3]:
                    f=k*(x-r)*(x-r-2)**2;h=f-x/S.Integer(m)
                    for c in [-3,0,2]:self.assertEqual(S.expand((f-(x/S.Integer(m)+c))-(h-c)),0)
        f=x*(x-2)**2;h=f-x
        roots0=set(S.solve(h,x));roots2=set(S.solve(h+2,x))
        self.assertEqual(len(roots0|roots2),6);self.assertFalse(roots0&roots2)
        # Integral sign under strictly positive weight and collisions at 1,5.
        f=x**3-9*x*x+15*x
        g=S.integrate((f-f.subs(x,t))*(t*t+1),(t,a,x))
        self.assertEqual(S.expand(S.diff(g,x)-S.diff(f,x)*S.integrate(t*t+1,(t,a,x))),0)
        for value in range(-3,10):
            polynomial=S.Poly(S.diff(g,x).subs(a,value),x)
            odd=sum(mult%2 for root,mult in polynomial.real_roots(multiple=False))
            self.assertEqual(odd,1 if value in (1,5) else 3)
        # Restoring a constant requires an anchor; distance requires orientation changes.
        position=t*(t-3)**2
        self.assertEqual(S.expand(S.diff(position,t)-(3*t*t-12*t+9)),0)
        points=[0,1,3,4];vals=[position.subs(t,v) for v in points]
        self.assertEqual(sum(abs(v-u) for u,v in zip(vals,vals[1:])),12)
        self.assertEqual(max(abs(v) for v in vals),4)
        self.assertEqual(S.diff(position+17,t),S.diff(position,t))
        # Zeros, sign changes, corners, repeated root sums are different outputs.
        for power in [1,2,3,4]:
            self.assertEqual(bool((-1)**power<0),power%2==1)
            right=S.limit(x**power/x,x,0,dir='+')
            left=S.limit((-x)**power/x,x,0,dir='-')
            self.assertEqual(right!=left,power==1)
        self.assertEqual(S.diff(x,x),S.diff(x+1,x)) # equal slope, unequal values
        self.assertNotEqual(S.Integer(0),S.Integer(1))
        self.assertEqual(S.expand((x**2+17)-(0**2+17)),x*x)
        self.assertEqual(S.expand((x/S.Integer(2))-x/S.Integer(2)),0) # linear shear can collapse a line

    def test_retired_studio_not_published(self):
        from prepare_pages import STATIC_FILES
        for name in ('studio-engine.js','studio-ui.js','studio.css','composer-ui.js','composer-engine.js'):
            self.assertNotIn(name,STATIC_FILES)
        html=(ROOT/'studio.html').read_text(encoding='utf-8')
        self.assertNotIn('makeBatch',html);self.assertIn('connections.html',html)
        self.assertNotIn('cpCreate',(ROOT/'motif-library.html').read_text(encoding='utf-8'))


    # ---- 2026-09-21 원본 문항 재생 회귀와 문법 가교 ----
    WITNESS_JS="""
    const W=require('./source-witnesses.json');const key=f=>JSON.stringify([f.type,f.subject,f.object||null,f.scope]);
    const strip=f=>({type:f.type,subject:f.subject,scope:'main',origin:'given',...(f.object?{object:f.object}:{})});
    const ops=new Map(R.operations.map(o=>[o.id,o]));
    const goalsMet=(facts,w)=>{const h=new Set(facts.map(key));return w.goals.every(g=>h.has(key({...g,scope:'main'})));};
    """

    def test_source_witnesses_replay_ten_original_and_three_new_core_routes(self):
        # Every seminar source question must be reconstructible from registry contracts alone.
        js(self.WITNESS_JS+"""
        assert.equal(W.witnesses.length,13);
        assert.equal(new Set(W.witnesses.map(w=>w.source_question_id)).size,13);
        for(const w of W.witnesses){
          const res=E.run({facts:w.facts.map(strip),nodes:w.nodes,revision:R.revision});
          assert.equal(res.status,'connected',w.id+' '+JSON.stringify(res.trace.filter(s=>s.status!=='direct').map(s=>[s.id,s.missing,s.reasons])));
          assert.ok(goalsMet(res.facts,w),w.id+' goals');
          assert.equal(res.release_ready,false);
          assert.ok(res.trace.every(s=>!s.redundant),w.id+' has a redundant step');
          for(const n of w.nodes)assert.ok(ops.has(n.id),w.id+' unregistered '+n.id);
          for(const p of w.principle_ids)assert.ok(W.principles.some(x=>x.id===p),w.id+' principle '+p);
        }
        """)

    def test_source_witnesses_every_given_is_load_bearing(self):
        # A given that can be dropped without losing the goal is decoration; the witness must not carry one.
        js(self.WITNESS_JS+"""
        for(const w of W.witnesses){
          const facts=w.facts.map(strip);
          for(let i=0;i<facts.length;i++){
            const res=E.run({facts:facts.filter((_,j)=>j!==i),nodes:w.nodes});
            assert.ok(res.status!=='connected'||!goalsMet(res.facts,w),w.id+' decorative given '+facts[i].type+'@'+facts[i].subject);
          }
        }
        """)

    def test_grammar_bridges_are_hidden_glue_and_auto_discoverable(self):
        js(self.WITNESS_JS+"""
        const grammar=R.operations.filter(o=>o.exposure==='grammar');
        assert.ok(grammar.length>=13);
        const questionOf=id=>{const r=R.records.find(x=>x.id===id);const p=(r&&r.payload)||r||{};return p.source_question_id||(p.tags||[]).find(t=>/^KICE-/.test(t))||(p.source_questions||[]).join(',')||'';};
        // A grammar bridge earns its place by a source replay OR by a registered recombination asset (source-witnesses.recombinations).
        const usedBy=new Map(grammar.map(g=>[g.id,[...W.witnesses.filter(w=>w.nodes.some(n=>n.id===g.id)).map(w=>w.source_question_id),...(W.recombinations||[]).filter(r=>r.grammar.includes(g.id)).map(r=>r.id)]]));
        for(const g of grammar){
          assert.equal(g.kind,'bridge',g.id+' grammar must be a bridge so suggest() can insert it');
          assert.equal(g.review_status,'ai_candidate');
          assert.ok(R.records.some(r=>r.id===g.grammar_family&&r.kind==='grammar_family'),g.id+' family');
          assert.ok(usedBy.get(g.id).length>=1,g.id+' unused by any witness or recombination');
          const questions=new Set(g.supports.map(questionOf).flatMap(q=>q.split(',')).filter(Boolean));
          assert.ok(questions.size>=2,g.id+' grammar must be evidenced by at least two source questions: '+[...questions]);
        }
        // Without grammar contracts the seven witnesses that need them do not connect.
        const R2=structuredClone(R);R2.operations=R2.operations.filter(o=>o.exposure!=='grammar');const E2=require('./connection-engine.js').create(R2);
        let needed=0;
        for(const w of W.witnesses){const uses=w.nodes.some(n=>ops.get(n.id).exposure==='grammar');const res=E2.run({facts:w.facts.map(strip),nodes:w.nodes.filter(n=>ops.get(n.id).exposure!=='grammar')});
          if(uses){needed++;assert.ok(res.status!=='connected'||!goalsMet(res.facts,w),w.id+' should need grammar');}else assert.equal(res.status,'connected',w.id);}
        assert.equal(needed,8);
        // Hidden glue: drop every bridge from the author's plan; the engine must reroute through bridges by itself.
        for(const w of W.witnesses){
          const visible=w.nodes.filter(n=>ops.get(n.id).kind!=='bridge');
          let state=E.prepare(w.facts.map(strip));
          for(const n of visible){
            if(E.inspect(state,n).status==='conditional'){const s=E.suggest(state,n,{bindings:w.bindings});assert.equal(s.status,'bridge',w.id+' no route to '+n.id);for(const b of s.paths[0])state=E.apply(state,b).facts;}
            const step=E.apply(state,n);assert.equal(step.check.status,'direct',w.id+' '+n.id);state=step.facts;
          }
          for(const g of w.goals){const k=key({...g,scope:'main'});if(new Set(state.map(key)).has(k))continue;
            let reached=false;
            for(const op of R.operations.filter(o=>o.kind==='bridge'&&o.provides.some(p=>p.type===g.type))){
              const node={id:op.id,bindings:w.bindings,scope:'main'};
              if(E.inspect(state,node).status==='conditional'){const s=E.suggest(state,node,{bindings:w.bindings});if(s.status==='bridge')for(const b of s.paths[0])state=E.apply(state,b).facts;}
              if(E.inspect(state,node).status==='direct'){state=E.apply(state,node).facts;if(new Set(state.map(key)).has(k)){reached=true;break;}}
            }
            assert.ok(reached,w.id+' goal '+g.type+' unreachable by discovery');
          }
          assert.ok(goalsMet(state,w),w.id+' discovery goals');
        }
        """)

    def test_grammar_set_is_minimal_and_recombination_density_is_regressed(self):
        # Optimality probe: every hidden bridge must be necessary somewhere, and the port census / join density must not silently regress.
        js(self.WITNESS_JS+"""
        const P=require('./design-planner.js');
        function autoRoute(engine,w){
          const visible=w.nodes.filter(n=>ops.get(n.id).kind!=='bridge');let state=engine.prepare(w.facts.map(strip));
          for(const n of visible){if(engine.inspect(state,n).status==='conditional'){const s=engine.suggest(state,n,{bindings:w.bindings});if(s.status!=='bridge')return false;for(const b of s.paths[0])state=engine.apply(state,b).facts;}
            const st=engine.apply(state,n);if(st.check.status!=='direct')return false;state=st.facts;}
          const have=new Set(state.map(key));
          for(const g of w.goals){const k=key({...g,scope:'main'});if(have.has(k))continue;let reached=false;
            for(const op of engine.registry.operations.filter(o=>o.kind==='bridge'&&o.provides.some(p=>p.type===g.type))){const node={id:op.id,bindings:w.bindings,scope:'main'};
              if(engine.inspect(state,node).status==='conditional'){const s=engine.suggest(state,node,{bindings:w.bindings});if(s.status==='bridge')for(const b of s.paths[0])state=engine.apply(state,b).facts;}
              if(engine.inspect(state,node).status==='direct'){state=engine.apply(state,node).facts;if(new Set(state.map(key)).has(k)){reached=true;break;}}}
            if(!reached)return false;}
          return true;
        }
        const grammar=R.operations.filter(o=>o.exposure==='grammar');
        const fusedNow=P.fused(R,W,E).length;
        for(const g of grammar){
          const R2=structuredClone(R);R2.operations=R2.operations.filter(o=>o.id!==g.id);const E2=require('./connection-engine.js').create(R2);
          const brokenWitness=W.witnesses.some(w=>!autoRoute(E2,w));
          const fewerFusions=P.fused(R2,W,E2).length<fusedNow;
          assert.ok(brokenWitness||fewerFusions,g.id+' is redundant: no witness and no recombination needs it');
        }
        // Port census: the recombination grammar removed the dead ends that block second-stage problems.
        const prov=new Set(R.operations.flatMap(o=>o.provides.map(p=>p.type))),req=new Set(R.operations.flatMap(o=>o.requires.map(p=>p.type)));
        const terminals=[...prov].filter(t=>!req.has(t));
        for(const t of ['tested_candidates','polynomial_known','graph_profile','root_multiplicities'])assert.ok(req.has(t),t+' must be consumable');
        const addedAnswers=['nonnegative_on_interval','area_result','continuity_report','minimum_result'];
        assert.ok(terminals.filter(t=>!addedAnswers.includes(t)).length<=12,'legacy terminal outputs grew: '+terminals.join(', '));
        for(const t of addedAnswers)assert.ok(terminals.includes(t),'new explicit answer '+t);
        // Recombination density floor (measured 2026-09-21: 4 genuine joins before F7 grammar, 22 fused templates after wrapper-target and clone exclusion; 15 load-bearing).
        assert.ok(fusedNow>=20,'fused templates '+fusedNow);
        const loadBearing=P.fused(R,W,E).filter(t=>{const a=P.ablate(t,R,E);return a.connected&&a.conditions.every(c=>c.load_bearing);}).length;
        assert.ok(loadBearing>=12,'load-bearing fused '+loadBearing);
        for(const r of W.recombinations){assert.ok(W.witnesses.some(w=>w.source_question_id===r.from)&&W.witnesses.some(w=>w.source_question_id===r.to),r.id);
          const t=P.fused(R,W,E).find(t=>t.id==='F:W:'+r.from+'>W:'+r.to);assert.ok(t,r.id+' fusion exists in engine');
          for(const g of r.grammar)assert.ok(t.nodes.some(n=>n.id===g),r.id+' uses '+g);}
        """)

    def test_recombination_mathematics(self):
        x=S.symbols('x',real=True)
        # RC-01: KICE-2021-11-Q22 fixes f=(x-1)^2(x-4)/2+1; then f(x)=k has three distinct roots iff -1<k<1 -> one integer k.
        f=S.Rational(1,2)*(x-1)**2*(x-4)+1;fp=S.factor(S.diff(f,x))
        self.assertEqual(S.expand(fp-S.Rational(3,2)*(x-3)*(x-1)),0);self.assertEqual((f.subs(x,1),f.subs(x,3)),(1,-1))
        count=lambda k:len(set(S.Poly(f-k,x).real_roots()))
        self.assertEqual([k for k in range(-5,6) if count(k)==3],[0]);self.assertEqual(count(S.Rational(1,2)),3);self.assertEqual(count(1),2)
        # RC-02: KICE-2021-09-Q22 fixes f=(x+1)^2(x-2); the signed-absolute corner condition then admits no positive (p,q): the fusion is type-valid but the numbers refuse it.
        g=(x+1)**2*(x-2);gp=S.diff(g,x);self.assertEqual(S.expand(gp-3*(x-1)*(x+1)),0)
        pairs=[(p,-g.subs(x,-p)) for p in (1,-1)]   # F'(0)=0 <=> g'(-p)=0
        self.assertFalse(any(p>0 and q>0 for p,q in pairs))
        # RC-01: f fixed by the window problem has f(1)=f(4), hence two simple critical roots; the Leibniz integral then has one extremum iff a is one of them: sum 4.
        F1=S.Rational(1,2)*(x-1)**2*(x-4)+1;self.assertEqual(F1.subs(x,1),F1.subs(x,4))
        roots=sorted(S.solve(S.diff(F1,x),x));self.assertEqual(roots,[1,3]);self.assertEqual(sum(roots),4)
        t_,a_=S.symbols('t a',real=True)
        for value in range(-1,6):
            gp=S.Poly(S.expand(S.diff(F1,x)*S.integrate(F1.subs(x,t_)**4,(t_,value,x))),x)
            odd=sum(m%2 for r,m in gp.real_roots(multiple=False))
            self.assertEqual(odd,1 if value in (1,3) else 3,value)
        # RC-03: the same fixed f has three simple roots, so the jump-continuity rule (a root 3 to the left of every simple root) fails at the leftmost root.
        simple=[r for r,m in S.Poly(F1,x).real_roots(multiple=False) if m==1];self.assertEqual(len(simple),3)
        self.assertFalse(any(S.simplify(F1.subs(x,r-3))==0 for r in simple))
        # G15: a fixed nonzero polynomial has finitely many roots and a derivative formula; G14 is only a declaration and adds no roots.
        self.assertLessEqual(len(S.Poly(g,x).real_roots()),3);self.assertEqual(S.degree(S.diff(g,x),x),2)

    def test_grammar_bridge_mathematics(self):
        x,t,a,al,k=S.symbols('x t a alpha k',real=True)
        # G03: the symmetric absolute-difference limit jumps only at simple roots.
        f=(x+1)**2*(x-2);fp=S.diff(f,x);h=S.symbols('h',positive=True)
        def sided(point,sign):
            return S.limit((S.Abs(f.subs(x,point+sign*h))-S.Abs(f.subs(x,point)))/(sign*h),h,0)
        self.assertEqual(sided(-1,1)+sided(-1,-1),0)          # double root: continuous, value 0
        self.assertEqual(sided(2,1)+sided(2,-1),0)            # value at the simple root is 0 ...
        near=[S.limit(2*S.sign(f)*fp,x,2,dir=d) for d in ('+','-')]
        self.assertEqual(near[0],-near[1]);self.assertNotEqual(near[0],0)   # ... but the one-sided limits differ: finite jump
        # G04/G06/G09/G10: KICE-2021-09-Q22 — root placement rule, family, root union, sum via reference point.
        F=(x-al)**2*(x-al-3);Fp=S.diff(F,x)
        roots=set(S.solve(F.subs(x,x-3),x))|set(S.solve(F,x))|set(S.solve(Fp,x))
        self.assertEqual(roots,{al,al+2,al+3,al+6})
        self.assertEqual(S.solve(S.Eq(sum(roots),7),al),[-1])
        self.assertEqual(F.subs({al:-1,x:5}),108)
        # G01/G02: KICE-2021-09-Q20 — piecewise profile, continuity at the joint, four roots iff 0<k<7, integer sum 21.
        g_right=x**3-9*x*x+15*x;g_left=-7*x
        self.assertEqual(g_right.subs(x,0),g_left.subs(x,0))
        def count(kv):
            r={v for v in S.Poly(g_right-kv,x).real_roots() if v>=0};l={v for v in S.Poly(g_left-kv,x).real_roots() if v<0}
            return len(r)+len(l)
        good=[kv for kv in range(-30,30) if count(S.Integer(kv))==4]
        self.assertEqual(good,[1,2,3,4,5,6]);self.assertEqual(sum(good),21);self.assertEqual(count(S.Integer(0)),3);self.assertEqual(count(S.Integer(7)),3)
        # G07: KICE-2021-11-Q22 — critical-root gap 2 pins k to {1,4}; f(0)=alpha-2 selects k=1; f(5)=9.
        fam=S.Rational(1,2)*(x-1)*(x-4)*(x-k);famp=S.Poly(S.diff(fam,x),x)
        gap_sq=S.simplify(S.discriminant(famp.as_expr(),x)/famp.LC()**2)
        self.assertEqual(set(S.solve(S.Eq(gap_sq,4),k)),{1,4})
        chosen=[kv for kv in (1,4) if S.simplify(fam.subs({k:kv,x:0})-(-2))==0]  # (f-alpha)(0) = -2
        self.assertEqual(chosen,[1]);self.assertEqual(fam.subs({k:1,x:5})+1,9)
        # G05: KICE-2021-06-Q14 — exactly one corner of sign(x)|F| forces the origin to be a double root: (p,q)=(1,7).
        base=x**3-3*x*x-9*x-12
        def corners(pv,qv):
            Fpq=S.Poly(base.subs(x,x-pv)+qv,x)
            assert Fpq.eval(0)==0
            return sum(1 for r,m in Fpq.real_roots(multiple=False) if m==1 and r!=0)
        self.assertEqual(corners(1,7),1)
        self.assertEqual(S.diff(base.subs(x,x-1)+7,x).subs(x,0),0)
        for pv in range(1,6):
            qv=-base.subs(x,-pv)
            if qv>0 and (pv,qv)!=(1,7):self.assertNotEqual(corners(pv,qv),1,(pv,qv))
        # G11/G12: KICE-2022-06-Q14 — unwrap g=x^2(x-a) into f=-/+g' and count f(x)=x through the corner slopes.
        gcube=x*x*(x-a);fr=S.diff(gcube,x);fl=-fr
        self.assertEqual(fr.subs(x,0),0)                                   # claim ㄱ f(0)=0
        self.assertEqual((S.diff(fr,x).subs(x,0),S.diff(fl,x).subs(x,0)),(-2*a,2*a))
        av=S.Rational(1,4)
        rr={v for v in S.solve(S.Eq(fr.subs(a,av),x),x) if v>=0};ll={v for v in S.solve(S.Eq(fl.subs(a,av),x),x) if v<0}
        self.assertEqual(len(rr|ll),3)
        # G13/TRAVEL-05: KICE-2022-11-Q14 — reaching the bound needs no interior zero; staying strictly below it does.
        def travelled(expr):  # total distance = sum of |position change| between consecutive turn times
            turns=sorted({S.Integer(0),S.Integer(1)}|{r for r in S.solve(S.diff(expr,t),t) if r.is_real and 0<r<1})
            return S.simplify(sum(abs(expr.subs(t,b)-expr.subs(t,a_)) for a_,b in zip(turns,turns[1:])))
        pos=-4*t*(t-1)
        self.assertEqual(travelled(pos),2);self.assertEqual(S.maximum(pos,t,S.Interval(0,1)),1);self.assertEqual(S.solve(pos,t),[0,1])
        pos2=t*(t-1)*(t-S.Rational(1,2));pos2=S.simplify(2/travelled(pos2))*pos2
        self.assertEqual(travelled(pos2),2)
        self.assertLess(S.maximum(S.Abs(pos2),t,S.Interval(0,1)),1);self.assertIn(S.Rational(1,2),S.solve(pos2,t))

if __name__=='__main__':unittest.main()
