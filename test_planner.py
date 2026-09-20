"""Goal-directed composition and intent preservation; fixtures stay in memory."""
from test_model import run_js
import unittest


class PlannerTests(unittest.TestCase):
    def test_starters_finish_at_a_question_with_no_unused_steps(self):
        run_js(r"""
        const P=require('./composition-planner.js'),S=require('./selection-model.js');
        const goals=['level_counts','integer_answer','distance_result'];
        for(const [i,start] of S.coreStarts.entries()){
          const seed=S.coreStart(R,start.id),before=JSON.stringify(seed);
          const target=P.targets(seed.plan,R,seed.coreId).find(c=>c.target.type===goals[i]);
          assert.ok(target);assert.ok(target.route.length>0);
          const next={...seed.plan,nodes:[...seed.plan.nodes,...target.route]},a=P.analyze(next,R,seed.coreId,target.target);
          assert.equal(a.ready,true);assert.equal(a.coreConnected,true);assert.deepEqual(a.unused,[]);
          assert.equal(JSON.stringify(seed),before);
          for(const n of target.route)assert.equal(P.analyze({...next,nodes:next.nodes.filter(m=>m.id!==n.id)},R,seed.coreId,target.target).ready,false);
        }
        """)

    def test_goal_and_core_cannot_be_smuggled_in_as_givens(self):
        run_js(r"""
        const P=require('./composition-planner.js');
        const target={type:'level_counts',subject:'H',scope:'main'};
        const spec=P.intent(plan,R,'PA-MOTIF-S01-10',target,0,1),strict=C.makeRequest(R,plan,job.brief,job.request_id,spec);
        assert.equal(C.validateResult(sample(),strict,R,E).accepted,true);
        const d=sample();d.plan.facts=E.run(plan).facts.map(f=>({type:f.type,subject:f.subject,object:f.object||null,scope:f.scope,origin:'given'}));
        const bad=C.validateResult(d,strict,R,E);assert.equal(bad.accepted,false);assert.ok(bad.errors.some(e=>e.includes('시작 조건')));
        const coreGiven=sample();coreGiven.plan.facts.push({type:'parallel_intersections',subject:'F',object:null,scope:'main',origin:'given'});
        assert.equal(C.validateResult(coreGiven,strict,R,E).accepted,false);
        assert.equal(C.validateResult(sample(),job,R,E).accepted,true); // historical v1 results remain readable
        """)

    def test_independent_material_is_not_a_goal_dependency(self):
        run_js(r"""
        const P=require('./composition-planner.js');
        const extra={id:'PA-S02-SIGNED-01',bindings:{f:'Z'},scope:'other'};
        const next={...structuredClone(plan),nodes:[...plan.nodes,extra],facts:[...plan.facts,{type:'definite_integral_definition',subject:'Z',scope:'other',origin:'given'}]};
        const target={type:'level_counts',subject:'H',scope:'main'},a=P.analyze(next,R,'PA-MOTIF-S01-10',target);
        assert.equal(a.result.status,'connected');assert.equal(a.ready,false);assert.deepEqual(a.unused,[extra.id]);
        const unrelated=P.analyze(next,R,extra.id,target);assert.equal(unrelated.coreConnected,false);
        assert.ok(!P.targets(next,R,extra.id).some(c=>c.target.type==='level_counts'));
        """)

    def test_structured_intent_cannot_change_subject_scope_or_request(self):
        run_js(r"""
        const P=require('./composition-planner.js');
        const spec=P.intent(plan,R,'PA-MOTIF-S01-10',{type:'level_counts',subject:'H',scope:'main'},0,2);
        const strict=C.makeRequest(R,plan,job.brief,job.request_id,spec);
        const body=JSON.parse(A.requestBody(strict,R).input);assert.deepEqual(body.design_intent,spec);
        for(const broken of [{...spec,reasoning:9},{...spec,core:{...spec.core,scope:'other'}},{...spec,target:{...spec.target,type:'unknown'}},{...spec,target:{...spec.target,object:'wrong'}}])assert.throws(()=>C.makeRequest(R,plan,job.brief,'REQ-bad',broken));
        const renamed=sample();for(const f of renamed.plan.facts)f.subject=f.subject==='F'?'Z':f.subject;
        for(const n of renamed.plan.nodes)if(n.bindings.f==='F')n.bindings.f='Z';
        assert.equal(E.run({...renamed.plan,facts:renamed.plan.facts.map(f=>({...f,object:f.object||undefined}))}).status,'connected');
        assert.equal(C.validateResult(renamed,strict,R,E).accepted,false);
        const wrongTarget={...strict,design_intent:{...spec,target:{...spec.target,scope:'other'}}};
        assert.equal(C.validateResult(sample(),wrongTarget,R,E).accepted,false);
        """)

    def test_order_repair_and_last_output_conflicts(self):
        run_js(r"""
        const P=require('./composition-planner.js');
        const backwards={...structuredClone(plan),nodes:[...plan.nodes].reverse()},before=JSON.stringify(backwards),fixed=P.reorder(backwards,R);
        assert.equal(E.run(fixed).status,'connected');assert.equal(JSON.stringify(backwards),before);assert.deepEqual(fixed.facts,plan.facts);
        assert.equal(P.reorder({...backwards,facts:[]},R),null);
        const r=structuredClone(R),op=r.operations.find(o=>o.id==='PA-BRIDGE-03');op.provides.push({type:'nonzero_scale',subject:'$a'});
        const engine=require('./connection-engine.js').create(r),conflict={revision:r.revision,nodes:[{id:op.id,bindings:{a:'a'},scope:'main'}],facts:[{type:'finite_parameter_set',subject:'a',scope:'main',origin:'given'},{type:'zero_scale',subject:'a',scope:'main',origin:'given'}]};
        const result=engine.run(conflict);assert.equal(result.status,'blocked');assert.ok(!result.facts.some(f=>f.type==='nonzero_scale'));
        """)

    def test_session_prompt_retains_machine_readable_intent(self):
        run_js(r"""
        const P=require('./composition-planner.js'),A=require('./server/codex-session.cjs'),fs=require('node:fs'),path=require('node:path'),{EventEmitter}=require('node:events');
        const spec=P.intent(plan,R,'PA-MOTIF-S01-10',{type:'level_counts',subject:'H',scope:'main'},0,1),strict=C.makeRequest(R,plan,job.brief,job.request_id,spec);let captured;
        const mock=(cmd,args,options)=>{const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();c.stdin=new EventEmitter();c.stdin.end=text=>{captured=JSON.parse(text.slice(text.lastIndexOf('\n')+1));setImmediate(()=>{fs.writeFileSync(path.join(options.cwd,'result.json'),JSON.stringify(sample()));c.emit('close',0);});};c.kill=()=>{};return c;};
        const out=await A.generateSession(strict,R,{spawnImpl:mock,checkLogin:async()=>({ready:true})});
        assert.deepEqual(captured.design_intent,spec);assert.equal(out.validation.accepted,true);assert.equal(out.validation.release_ready,false);
        """)


if __name__ == '__main__':
    unittest.main()
