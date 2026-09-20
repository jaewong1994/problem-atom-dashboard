"""Dependency graphs, branch roles and the Sol boundary. Fixtures stay in memory."""
from test_model import run_js
import unittest


class GraphTests(unittest.TestCase):
    def test_parallel_information_rejoins_and_orders_without_new_givens(self):
        run_js(r"""
        const G=require('./composition-graph.js'),before=JSON.stringify(plan);
        const reversed={...structuredClone(plan),nodes:[...plan.nodes].reverse()},g=G.compile(reversed,R);
        assert.equal(g.result.status,'connected');assert.deepEqual(g.plan.facts,plan.facts);
        const inputs=g.edges.filter(e=>e.to==='PA-OP-FIXED-LEVELS');
        assert.deepEqual(new Set(inputs.map(e=>e.from)),new Set(['PA-BRIDGE-01','PA-BRIDGE-02']));
        assert.ok(inputs.every(e=>e.via.length));assert.equal(JSON.stringify(plan),before);
        for(const id of ['PA-BRIDGE-01','PA-BRIDGE-02'])assert.notEqual(G.compile({...plan,nodes:plan.nodes.filter(n=>n.id!==id)},R).result.status,'connected');
        """)

    def test_roles_are_contextual_and_do_not_change_math_work(self):
        run_js(r"""
        const G=require('./composition-graph.js');
        const a=G.spec(plan,R,{roles:{'PA-BRIDGE-02':'reasoning'}}),b=G.spec(plan,R,{roles:{'PA-BRIDGE-02':'calculation'}});
        assert.deepEqual(a.edges,b.edges);assert.notDeepEqual(a.roles,b.roles);
        assert.equal(G.normalizeSpec(a,plan,R).roles.find(r=>r.id==='PA-BRIDGE-02').role,'reasoning');
        assert.deepEqual(G.compile(plan,R).result.work,E.run(plan).work);
        const view=G.state({roles:{'deleted':'reasoning','PA-BRIDGE-02':'calculation'},positions:{'deleted':{x:1,y:2},'PA-BRIDGE-02':{x:44,y:55}}},plan);
        assert.deepEqual(Object.keys(view.roles),['PA-BRIDGE-02']);assert.equal(view.positions['PA-BRIDGE-02'].x,44);
        assert.throws(()=>G.state({roles:{'PA-BRIDGE-02':'fake'}},plan));
        """)

    def test_drawn_edge_cannot_claim_a_wrong_function_scope_or_source(self):
        run_js(r"""
        const G=require('./composition-graph.js'),valid=G.spec(plan,R,{});
        for(const change of [s=>s.edges.pop(),s=>s.edges.push(s.edges[0]),s=>s.edges[0].from='unknown',s=>s.edges[0].via[0]='["polynomial","wrong",null,"other"]',s=>s.roles[0].role='killer']){
          const s=structuredClone(valid);change(s);assert.throws(()=>G.normalizeSpec(s,plan,R));
        }
        const wrong=structuredClone(plan);wrong.nodes.find(n=>n.id==='PA-BRIDGE-02').bindings.f='OTHER';
        assert.notEqual(G.compile(wrong,R).result.status,'connected');
        assert.throws(()=>G.spec(wrong,R,{}));
        """)

    def test_circular_missing_and_conflicting_branches_cannot_be_submitted(self):
        run_js(r"""
        const G=require('./composition-graph.js');
        const r=structuredClone(R),a=r.operations.find(o=>o.id==='PA-BRIDGE-01'),b=r.operations.find(o=>o.id==='PA-BRIDGE-02');
        a.requires=[{type:'graph_profile',subject:'$f'}];a.provides=[{type:'polynomial_known',subject:'$f'}];a.forbids=[];
        b.requires=[{type:'polynomial_known',subject:'$f'}];b.provides=[{type:'graph_profile',subject:'$f'}];b.forbids=[];
        const p={revision:r.revision,facts:[],nodes:[{id:a.id,bindings:{f:'F',h:'H'},scope:'main'},{id:b.id,bindings:{f:'F'},scope:'main'}]};
        assert.equal(G.compile(p,r).result.status,'conditional');assert.throws(()=>G.spec(p,r,{}));
        const bad=structuredClone(plan);bad.facts.push({type:'zero_scale',subject:'F',scope:'main',origin:'given'});
        assert.equal(G.compile(bad,R).result.status,'blocked');assert.throws(()=>G.spec(bad,R,{}));
        assert.throws(()=>G.compile({...plan,nodes:[...plan.nodes,plan.nodes[0]]},R));
        """)

    def test_attach_uses_selected_node_and_preserves_givens(self):
        run_js(r"""
        const G=require('./composition-graph.js'),S=require('./selection-model.js');
        const seed=S.coreStart(R,'PA-MOTIF-S01-10'),recs=G.recommendations(seed.plan,R,seed.coreId,'calculation');
        const item=recs.find(r=>r.id==='PA-BRIDGE-02');assert.ok(item);assert.ok(item.nodes.length>=2);
        const next=G.attach(seed.plan,R,seed.coreId,item,'calculation',{}),graph=G.compile(next.plan,R);
        assert.equal(graph.result.status,'connected');assert.equal(next.mapState.roles[item.id],'calculation');assert.deepEqual(next.plan.facts,seed.plan.facts);
        assert.ok(graph.edges.some(e=>e.from===seed.coreId));
        assert.throws(()=>G.attach(seed.plan,R,'PA-S02-TRAVEL-02',item,'calculation',{}));
        const forged={...item,nodes:[{id:'PA-S02-TRAVEL-02',bindings:{f:'F'},scope:'main'}]};assert.throws(()=>G.attach(seed.plan,R,seed.coreId,forged,'calculation',{}));
        """)

    def test_graph_survives_api_canonicalization_and_checks_result_edges(self):
        run_js(r"""
        const G=require('./composition-graph.js'),P=require('./composition-planner.js');
        const graph=G.spec(plan,R,{roles:{'PA-BRIDGE-02':'calculation'}}),intent=P.intent(plan,R,'PA-MOTIF-S01-10',{type:'level_counts',subject:'H',scope:'main'},0,1,graph);
        const strict=C.makeRequest(R,plan,job.brief,job.request_id,intent),input=JSON.parse(A.requestBody(strict,R).input);
        assert.deepEqual(input.design_intent.graph,graph);assert.ok(C.handoff(strict).includes('reasoning-graph/1'));
        assert.equal(C.validateResult(sample(),strict,R,E).accepted,true);
        const alternate=structuredClone(plan);alternate.facts.push({type:'graph_profile',subject:'H',scope:'main',origin:'given'});
        assert.ok(G.validateResult(graph,alternate,R).length>0);
        """)

    def test_graph_survives_codex_session_prompt(self):
        run_js(r"""
        const G=require('./composition-graph.js'),P=require('./composition-planner.js'),D=require('./server/codex-session.cjs'),fs=require('node:fs'),path=require('node:path'),{EventEmitter}=require('node:events');
        const graph=G.spec(plan,R,{}),spec=P.intent(plan,R,'PA-MOTIF-S01-10',{type:'level_counts',subject:'H',scope:'main'},0,1,graph),strict=C.makeRequest(R,plan,job.brief,job.request_id,spec);let captured;
        const spawn=(cmd,args,options)=>{const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.stdin=new EventEmitter();child.stdin.end=text=>{captured=JSON.parse(text.slice(text.lastIndexOf('\n')+1));setImmediate(()=>{fs.writeFileSync(path.join(options.cwd,'result.json'),JSON.stringify(sample()));child.emit('close',0);});};child.kill=()=>{};return child;};
        const out=await D.generateSession(strict,R,{spawnImpl:spawn,checkLogin:async()=>({ready:true})});
        assert.deepEqual(captured.design_intent.graph,graph);assert.equal(out.validation.accepted,true);assert.equal(out.validation.release_ready,false);
        """)


if __name__ == '__main__':
    unittest.main()
