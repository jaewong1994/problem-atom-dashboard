"""Independent exact checks for the shipped JS engine, including critical boundaries."""
import json,subprocess,unittest,shutil,re
from pathlib import Path
from functools import lru_cache
import sympy as S
ROOT=Path(__file__).resolve().parent
NODE=shutil.which('node') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')
x,t=S.symbols('x t',real=True)

def real_roots(p):
    return S.Poly(p,x).real_roots(multiple=False)

def roots_in(p,side):
    return sum(1 for r,m in real_roots(p) if side(r))

@lru_cache(None)
def check_levels(d,k,B):
    f=S.Rational(k,2)*x**3-S.Rational(9*k*d,2)*x*x+10*k*d*d*x
    H=S.expand(2*f-5*k*d*d*x)
    assert S.discriminant(x*x-9*d*x+22*d*d,x)==-7*d*d
    assert S.expand(S.diff(H,x)-3*k*(x-d)*(x-5*d))==0
    M=H.subs(x,d); low=H.subs(x,5*d)
    assert M==7*k*d**3 and low<0
    for y,n in [(0,3),(M,3),(M/2,4),(M+1,2),(low-1,0)]:
        count=roots_in(H-y,lambda r:r>=0)+int(bool(y>0))
        assert count==n,(d,k,y,count,n)
    return M

class StudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=json.loads(subprocess.check_output([NODE,str(ROOT/'studio-engine.js')],encoding='utf-8'))
        cls.catalog=json.loads((ROOT/'composition-catalog.json').read_text(encoding='utf-8'))

    def test_all_360_questions_exact_answers(self):
        self.assertEqual(len(self.rows),360)
        for row in self.rows:
            p=row['parameters'];family=row['options']['family'];hard=row['options']['level']=='challenge'
            with self.subTest(options=row['options']):
                if family=='levels':
                    d,k,B=[p[n] for n in ('d','k','B')];M=check_levels(d,k,B)
                    answer=sum(1 for n in range(1,int(S.sqrt(B+M))+1) if B<n*n<B+M) if hard else sum(range(B+1,B+int(M)))
                elif family=='jump':
                    a,d,c,z=[p[n] for n in ('a','d','c','z')];f=c*(x-a)**2*(x-a-d)
                    zeros=set(S.solve(f.subs(x,x-d),x)+S.solve(f,x)+S.solve(S.diff(f,x),x))
                    self.assertEqual(sorted(zeros),[a,a+2*d//3,a+d,a+2*d])
                    self.assertEqual(sum(zeros),p['S']);v=sorted(zeros);self.assertEqual(v[0]+2*v[1]+v[3],p['W'])
                    # At the only jump point beta=a+d the multiplier vanishes.
                    self.assertEqual(f.subs(x,(a+d)-d),0)
                    alpha=a+d;dv=S.diff(f,x).subs(x,alpha)
                    self.assertNotEqual(2*dv,-2*dv)
                    self.assertEqual(S.limit(f.subs(x,x-d)*2*S.diff(f,x),x,alpha),0)
                    answer=f.subs(x,z)
                elif family=='recurrence':
                    c,b,A,B=[p[n] for n in ('c','b','A','B')]
                    f0=c*x+b;f1=S.expand((x-1)*f0.subs(x,x-1)+A*(x-1)+B)
                    f2=S.expand((x-1)*f1.subs(x,x-1)+A*(x-1)+B)
                    for left,right,edge in [(f0,f1,1),(f1,f2,2)]:
                        self.assertEqual(left.subs(x,edge),right.subs(x,edge));self.assertEqual(S.diff(left,x).subs(x,edge),S.diff(right,x).subs(x,edge))
                    answer=12*S.integrate(f2 if hard else f1,(x,2 if hard else 1,3 if hard else 2))
                elif family=='window':
                    u,h,v,z=[p[n] for n in ('u','h','v','z')];L=2*h
                    f=(x-u)**2*(x-v)/(2*h*h)+u
                    alt=(x-u)*(x-v)**2/(2*h*h)+u+h
                    for form in (f,alt):
                        rr=S.solve(S.diff(form,x),x);self.assertEqual(rr[1]-rr[0],L)
                        for probe in (u,v):self.assertEqual(sum(bool(form.subs(x,probe)<=r<=form.subs(x,probe)+L) for r in rr),2)
                    rr=S.solve(S.diff(f,x),x);ar=S.solve(S.diff(alt,x),x)
                    self.assertEqual(sum(bool(f.subs(x,z)<=r<=f.subs(x,z)+L) for r in rr),1)
                    self.assertEqual(sum(bool(alt.subs(x,z)<=r<=alt.subs(x,z)+L) for r in ar),0)
                    if hard:
                        y=p['ratio']*h
                        answer=len(set(S.Poly(f-u-y,x).real_roots()+S.Poly(f-u+y,x).real_roots()))
                    else:answer=f.subs(x,p['probe'])
                elif family=='signed':
                    a,m,U=[p[n] for n in ('a','m','U')];G=x*x*(x-a);left=-S.diff(G,x);right=S.diff(G,x)
                    self.assertEqual(S.expand(-S.integrate(left,(x,0,t))-G.subs(x,t)),0);self.assertEqual(S.expand(S.integrate(right,(x,0,t))-G.subs(x,t)),0)
                    def count(n):return roots_in(left-n*x,lambda r:r<0)+roots_in(right-n*x,lambda r:r>=0)
                    answer=sum(n for n in range(1,U+1) if count(n)==3) if hard else count(m)
                    self.assertEqual(count(max(1,2*abs(a)+1)),3)
                    if a:self.assertEqual(count(2*abs(a)),2)
                else:
                    s,M,T,b,D=[p[n] for n in ('s','M','T','b','D')];A=S.Rational(M,s**3);pos=A*x*(x-T)*(2*x-b)
                    crit=S.solve(S.diff(pos,x),x);self.assertEqual(crit,[3*s,10*s])
                    coords=[pos.subs(x,v) for v in [0,*crit,T]]
                    distance=sum(abs(v-u) for u,v in zip(coords,coords[1:]));self.assertEqual(distance,D)
                    answer=max(abs(v) for v in coords);self.assertLessEqual(answer,S.Rational(D,2))
                self.assertEqual(answer,row['answer'])

    def test_asset_contract_and_wording(self):
        ids={a['id'] for a in self.catalog['atoms']}
        self.assertEqual(len(ids),21);self.assertEqual(len(self.catalog['sources']),7)
        self.assertEqual(len(self.catalog['recipes']),6)
        for a in self.catalog['atoms']:
            for key in ['input','output','guard','failure','source_question_id']:self.assertTrue(a[key])
            self.assertIsNone(a['approved_at'])
        for row in self.rows:
            self.assertTrue(set(row['assets'])<=ids);self.assertFalse(row['release_ready'])
            text=' '.join(row['question']);self.assertIn('구하시오',text)
            self.assertFalse(any(s in text for s in ['비음수','영점','소거','상쇄','서술하시오','최대값','최소값']))
            self.assertEqual(text.count('$')%2,0)
            self.assertGreaterEqual(len(row['steps']),1)

    def test_option_effects_and_cross_recipe_connections(self):
        index={(r['options']['family'],r['options']['level'],r['options']['calculation'],r['options']['seed']):r for r in self.rows}
        for family in ['levels','jump','recurrence','window','signed','travel']:
            for seed in [0,1,19,2147483647]:
                g=index[family,'guided','light',seed];s=index[family,'standard','light',seed];h=index[family,'challenge','light',seed]
                self.assertNotEqual(g['question'],s['question']);self.assertNotEqual(s['question'],h['question'])
                self.assertGreater(len(h['steps']),len(g['steps']))
                self.assertNotEqual(index[family,'standard','full',seed]['question'],s['question'])
        high=index['window','challenge','light',0]
        self.assertIn('PA-S02-LEVELS-02',high['assets'])
        self.assertIn('PA-S02-LEVELS-03',index['signed','challenge','light',0]['assets'])

    def test_boundary_witnesses_and_removed_conditions(self):
        # A function can hit zero without changing sign, and can change sign while |f| is differentiable.
        self.assertEqual(S.limit(abs(x**3)/x,x,0,dir='+'),0)
        self.assertEqual(S.limit(abs(x**3)/x,x,0,dir='-'),0)
        # Triple root survives continuity but violates the four-root condition.
        self.assertEqual(len(set(S.solve((x-3)**3*x*x,x))),2)
        # Removing derivative matching leaves different answers despite matching values.
        values=[S.integrate(x*x+A*x+1,(x,0,1)) for A in [1,2]]
        self.assertNotEqual(*values)
        # Closed moving interval: both endpoints count at equality, though each one-sided limit is one.
        def n(t0,roots):return sum(bool(t0<=r<=t0+2) for r in roots)
        self.assertEqual([n(v,[0,2]) for v in [S.Rational(-1,10),0,S.Rational(1,10)]],[1,2,1])
        self.assertEqual(n(S.Rational(-1,10),[0,1]),2)
        # Travel bound requires a return: X(t)=t does not satisfy D/2.
        self.assertGreater(1,S.Rational(1,2))

    def test_original_seminar_answers(self):
        self.assertEqual(sum(range(1,7)),21)
        f=(x+1)**2*(x-2);self.assertEqual(f.subs(x,5),108)
        self.assertEqual(60*S.integrate(x*x+x+1,(x,0,1)),110)
        f=S.Rational(1,2)*(x-1)**2*(x-4)+1;self.assertEqual(f.subs(x,5),9)
        # June 2022: no local maximum when a=0; exactly three roots for -1/2<a<1/2.
        for a in [S.Rational(-1,3),0,S.Rational(1,3)]:
            roots=set([0,(2*a-1)/3,(2*a+1)/3]);self.assertEqual(len(roots),3)
            self.assertLess((2*a-1)/3,0);self.assertGreater((2*a+1)/3,0)
        # November 2022: independent witness with rational turning times.
        pos=x*(x-1)*(2*x-S.Rational(5,4));critical=S.solve(S.diff(pos,x),x)
        vals=[pos.subs(x,t0) for t0 in [0,*critical,1]]
        D=sum(abs(v-u) for u,v in zip(vals,vals[1:]))
        self.assertLess(2*max(abs(v) for v in vals),D)
        self.assertEqual(pos.subs(x,S.Rational(5,8)),0)

    def test_selected_assets_are_actually_used(self):
        for r in self.rows:
            if r['options']['level']=='guided':
                removed={'levels':['PA-S02-LEVELS-01'],'jump':['PA-S02-JUMP-02','PA-S02-JUMP-03'],'recurrence':['PA-S02-RECURRENCE-01','PA-S02-RECURRENCE-03'],'signed':['PA-S02-SIGNED-01','PA-S02-SIGNED-02'],'window':['PA-S02-WINDOW-02'],'travel':[]}
                self.assertFalse(set(r['assets'])&set(removed[r['options']['family']]))
        for a in self.catalog['atoms']:
            self.assertTrue(any(a['id'] in r['assets'] for r in self.rows),a['id'])
            for file,pages in a['source_pages'].items():
                source=next(s for s in self.catalog['sources'] if s['key']==file)
                self.assertTrue(all(1<=p<=source['pages'] for p in pages))

    def test_rejection_determinism_and_math_rendering(self):
        script=r"""
const e=require('./studio-engine.js'),k=require('./vendor/katex/katex.min.js');
const o={family:'window',level:'challenge',calculation:'full',seed:19};
if(JSON.stringify(e.generate(o))!==JSON.stringify(e.generate(o)))throw Error('unstable');
for(const patch of [{seed:-1},{seed:0.1},{seed:NaN},{family:'freeform'},{level:'unknown'},{calculation:'unknown'}]){let failed=false;try{e.generate({...o,...patch})}catch(e){failed=true}if(!failed)throw Error('invalid accepted')}
const rows=JSON.parse(require('child_process').execFileSync(process.execPath,['studio-engine.js'],{encoding:'utf8'}));
for(const row of rows)for(const s of [...row.question,...row.solution])for(const m of s.matchAll(/\$([^$]+)\$/g))k.renderToString(m[1],{throwOnError:true});
console.log('ok');
"""
        self.assertEqual(subprocess.check_output([NODE,'-e',script],cwd=ROOT,encoding='utf-8').strip(),'ok')

if __name__=='__main__':unittest.main()


