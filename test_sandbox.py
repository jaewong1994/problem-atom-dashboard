import copy
import json
import tempfile
import unittest
from pathlib import Path
import sympy as s
from build_sandbox import ROOT, build, make_examples, asset_revision
from apply_group_reviews import validate

class SandboxTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog,cls.bank=build()

    def test_partition_and_new_asset(self):
        board=json.loads((ROOT/'promotion-board.json').read_text(encoding='utf-8'))
        ids=[c['id'] for a in board['instructors'] for c in a['candidates']]
        members=[m['id'] for g in self.catalog['groups'] for m in g['members']]
        self.assertEqual(sorted(ids),sorted(members));self.assertEqual(len(members),len(set(members)))
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            for name in ['promotion-board.json','asset-library.json','motif-library.json']:
                (root/name).write_bytes((ROOT/name).read_bytes())
            board['instructors'][0]['candidates'].append(dict(id='NEW-ASSET',name='새 자산',definition='추가',kind='concept'))
            (root/'promotion-board.json').write_text(json.dumps(board),encoding='utf-8')
            catalog,bank=build(root)
            self.assertEqual(len(catalog['groups']),len(self.catalog['groups'])+1)
            self.assertNotEqual(bank['version'],self.bank['version'])
            self.assertNotEqual(bank['examples'][0]['seed'],self.bank['examples'][0]['seed'])

    def test_human_partition_validation(self):
        g=self.catalog['groups'][0];ids=[m['id'] for m in g['members']]
        row=dict(groupId=g['id'],revision=g['revision'],actor='테스트',parts=[dict(memberIds=ids[:1],proposal='분리 검토',verdict='hold'),dict(memberIds=ids[1:],proposal='묶음 검토',verdict='approve')])
        p=dict(schema='problem-atom/group-review/1.0',actor='테스트',groups=[row])
        self.assertEqual(len(validate(p,self.catalog)),1)
        bad=copy.deepcopy(p);bad['groups'][0]['parts'][0]['memberIds'].append(ids[1])
        with self.assertRaises(ValueError):validate(bad,self.catalog)
        bad=copy.deepcopy(p);bad['groups'][0]['revision']='stale'
        with self.assertRaises(ValueError):validate(bad,self.catalog)

    def test_all_generated_math(self):
        x,t,a,p=s.symbols('x t a p',real=True)
        for e in self.bank['examples']:
            with self.subTest(seed=e['seed']):
                z=e['parameters']
                if 'r' in z:
                    r,v,b=z['r'],z['s'],z['b'];F=2*x**3-3*(r+v)*x**2+6*r*v*x
                    G=s.integrate((F-F.subs(x,t))*((t-b)**2+1),(t,a,x))
                    D=s.diff(G,x)
                    self.assertEqual(s.expand(D-s.diff(F,x)*s.integrate((t-b)**2+1,(t,a,x))),0)
                    for av,expected in [(r-1,3),(r,1),(s.Rational(r+v,2),3),(v,1),(v+1,3)]:
                        intervals=s.Poly(D.subs(a,av),x).intervals(eps=s.Rational(1,1000))
                        self.assertEqual(sum(mult%2 for _,mult in intervals),expected)
                    self.assertEqual(int(e['answer']),v if z['select'] else r+v)
                elif 'h' in z:
                    h,L,C=z['h'],z['L'],z['C'];F=x**3-3*h*x**2+C
                    left=F-F.subs(x,0);right=s.expand(F.subs(x,x+p)-F.subs(x,p))
                    self.assertEqual(s.solve(s.diff(right,x).subs(x,0)-s.diff(left,x).subs(x,0),p),[0,2*h])
                    right=right.subs(p,2*h)
                    self.assertEqual(s.limit(right,x,0),s.limit(left,x,0))
                    self.assertEqual(s.expand(left-x*x*(x-3*h)),0);self.assertEqual(s.expand(right-x*x*(x+3*h)),0)
                    self.assertEqual(s.integrate(-left,(x,-L,0))+s.integrate(right,(x,0,L)),int(e['answer']))
                else:
                    d,m,sign=z['d'],z['m'],z['sign'];H=(x-m)**3-3*d*d*(x-m);T=sign*2*d**3
                    Q=s.expand((H-T)*(H+T)**2)
                    roots=s.roots(Q,x);self.assertEqual(len(roots),4)
                    self.assertTrue(all(root.is_real for root in roots))
                    simple=[root for root,mult in roots.items() if mult==1]
                    self.assertEqual(simple,[m+sign*2*d]);self.assertEqual(4+sum(simple),int(e['answer']))

    def test_rejection_cases(self):
        x=s.symbols('x',real=True)
        for m in (1,2,3):
            left=s.limit(s.Abs(x**m)/x,x,0,dir='-');right=s.limit(s.Abs(x**m)/x,x,0,dir='+')
            self.assertEqual(left!=right,m==1)
        self.assertEqual(s.roots(x**3,x),{0:3})
        w=s.Piecewise((0,x<=1),((x-1)**2,True))
        self.assertEqual(s.integrate(w,(x,0,1)),0)

    def test_absolute_transform_split(self):
        for value in (-9,-1,s.Rational(-1,3),0,s.Rational(1,3),1,9):
            self.assertEqual(abs(value)+value,2*value if value>=0 else 0)
            self.assertEqual(abs(value)-value,0 if value>=0 else -2*value)
            if value:self.assertEqual(abs(value)/value,1 if value>0 else -1)
        self.assertNotEqual(abs(-3)-(-3),2*(-3))

    def test_shift_and_contact_candidates(self):
        x=s.symbols('x',real=True);F=x**3-3*x*x-9*x-12
        self.assertEqual({(-v,-F.subs(x,v)) for v in s.solve(s.diff(F,x),x)},{(1,7),(-3,39)})
        self.assertEqual(s.factor(F.subs(x,x-1)+7),x*x*(x-6))
        # Equal slope has two candidate points; selecting just the named point is unsafe.
        self.assertEqual(s.solve(s.diff(x**3-3*x,x),x),[-1,1])

    def test_new_approved_binding_and_changed_content(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            for name in ['promotion-board.json','asset-library.json','motif-library.json']:(root/name).write_bytes((ROOT/name).read_bytes())
            assets=json.loads((root/'asset-library.json').read_text(encoding='utf-8'))
            item=dict(id='TEST-APPROVED',name='검증 역할',kind='skill',definition='시험용',status='approved')
            assets['entities'].append(item);(root/'asset-library.json').write_text(json.dumps(assets),encoding='utf-8')
            (root/'combination-bindings.json').write_text(json.dumps({'bindings':[dict(asset_id=item['id'],source_motif_id='PA-MOTIF-S01-01',asset_revision=asset_revision(item))]}),encoding='utf-8')
            _,bank=build(root)
            self.assertTrue(any(m['id']==item['id'] for e in bank['examples'] for m in e['elements']))
            item['definition']='수정됨';(root/'asset-library.json').write_text(json.dumps(assets),encoding='utf-8')
            _,bank=build(root)
            self.assertFalse(any(m['id']==item['id'] for e in bank['examples'] for m in e['elements']))
            self.assertTrue(any(m['id']==item['id'] for m in bank['unadapted']))

    def test_reproducible_and_missing_motif(self):
        motifs=json.loads((ROOT/'motif-library.json').read_text(encoding='utf-8'))
        one=make_examples({},motifs,'f'*64);two=make_examples({},motifs,'f'*64)
        self.assertEqual(one,two)
        for r in motifs['recipes']:r['motifs']=[m for m in r['motifs'] if m['id']!='PA-MOTIF-S01-01']
        self.assertFalse(any(e['family']=='적분·영점충돌' for e in make_examples({},motifs,'f'*64)))

if __name__=='__main__':unittest.main()
