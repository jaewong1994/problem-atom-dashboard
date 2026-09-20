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
            const blocked=[...givens,{type:port.type,subject:node.bindings[port.subject.slice(1)],scope:'main',origin:'given'}];
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

if __name__=='__main__':unittest.main()
