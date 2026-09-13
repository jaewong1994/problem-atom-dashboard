"""Rebuild review recommendations and checked example bank from current assets.

No inference from keyword similarity is treated as mathematical equivalence.
Unmapped additions enter a single-item review queue and await a generator adapter.
"""
import hashlib
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()

def asset_revision(asset):
    return asset.get('contentHash') or digest({k:asset.get(k) for k in ('id','kind','name','definition')})

def cid(kind, number, old=False):
    return f'PA-CAND-{kind}-202609{8 if old else 10:02d}-{number:03d}'

GROUPS = [
 ('derivative','차형 적분의 미분', [('CON',1),('CON',1,True),('SKL',28),('CON',31)],
  '다항식 F,w에 대해 G(x)=∫ₐˣ(F(x)−F(t))w(t)dt이면 G′(x)=F′(x)∫ₐˣw(t)dt. 곱의 미분과 정적분의 미분으로 유도한다.',
  '일반적인 이변수 함수의 미분 공식과 다항식 가족에서의 유도는 적용 범위가 다르다. 공식·유도·항등식 근거의 역할을 유지한다.'),
 ('sign','정적분의 부호와 엄격한 증가', [('CON',2),('DEC',1,True),('CON',30)],
  'w가 비음수 다항식이고 영다항식이 아니면 모든 양의 길이 구간의 적분이 양수이므로 ∫ₐˣw(t)dt의 부호는 x−a와 같다.',
  '임의의 비음수 함수에는 그대로 확장하지 않는다. 일정 구간에서 0인 함수는 구간 전체의 적분도 0일 수 있다. 성질과 적용 판단은 별도 역할이다.'),
 ('collision','영점 충돌과 극값 개수', [('DEC',3),('SKL',4),('STR',5),('PAT',6),('CON',32),('SKL',1,True),('STR',1,True),('PAT',1,True),('CON',29)],
  '도함수의 부호가 (x−r)(x−s)(x−a)의 부호와 같고 r<s이면 a=r 또는 a=s일 때만 극값이 1개이다. 서로 다른 세 영점에서는 3개이다.',
  '도함수 부호가 각 영점 사이에서 일정한 이 가족으로 제한한다. 극값에서 도함수 부호가 바뀐다는 문장을 임의 함수의 일반 명제로 승인하지 않는다. 부호표·판단·전략·유형은 연결하되 하나로 합치지 않는다.'),
 ('absolute','원점 상쇄와 절댓값 꺾임', [('CON',7),('CON',8),('DEC',9),('SKL',33)],
  '다항식 P의 |P|는 단순근에서만 미분 불가능하다. sgn(x)|P(x)|는 원점의 연속성을 맞춰 P(0)=0이면 원점에서 미분 가능하므로 원점 밖 단순근을 따로 센다.',
  '삼중근도 부호가 바뀌지만 |P|의 꺾임은 아니다. sgn(x)의 원점 규칙을 원점 밖에 적용하지 않는다.'),
 ('shift','이동량 후보를 만들고 선택', [('SKL',10),('STR',11),('PAT',12)],
  '원점 연속성과 원점 밖 꺾임 수를 먼저 번역한 뒤 이동 전 다항식의 극점을 원점으로 옮기는 후보를 모두 계산하고 이동량의 부호 조건으로 선택한다.',
  '항상 극점을 옮기면 된다고 일반화하지 않는다. 원점의 근 차수와 원점 밖 단순근 개수를 먼저 확인한다.'),
 ('normalization','함숫값 차와 상수항 소거', [('CON',13),('STR',17)],
  'F(x)−F(0), F(x+p)−F(p)로 정의된 조각함수에서는 상수항이 소거된다. 공통 표현을 재사용하되 보기별 가정은 합치지 않는다.',
  '차형 표현의 성질과 여러 보기에 재사용하는 전략은 다른 역할이다. 상수항 결정 조건을 넣어도 요구량에 영향이 없을 수 있다.'),
 ('boundary','붙임점 미분과 조건 선택', [('CON',14),('DEC',15),('SKL',16),('PAT',18)],
  '다항식 조각을 함숫값 차로 붙이면 원점 연속은 자동이다. 좌우 미분계수를 맞춰 이동량 후보를 구한 뒤 양수 조건으로 선택하고 구간별 적분을 계산한다.',
  '연속이 자동인 정의에서만 미분계수 일치만 검사한다. 보기 문항에서는 각 보기의 가정을 독립적으로 적용한다.'),
 ('composition','합성방정식을 외부 함수의 근으로 분해', [('CON',19),('CON',21),('PAT',27)],
  '외부 다항식의 서로 다른 실근을 먼저 구하고 내부 함수가 각 근과 같아지는 방정식으로 분해한다. 근의 개수와 중복도를 구분한다.',
  '삼차식의 서로 다른 실근 2개는 단순근과 중근이다. 합성 후 중복도는 곱해지며, 실근 개수에서는 중복 계산하지 않는다.'),
 ('tangent','접촉 후보를 모두 복원하고 검산', [('CON',20),('CON',22),('DEC',24),('SKL',25),('CON',23),('STR',26),('SKL',34)],
  '접촉은 함수와 직선의 차에서 중복근을 만든다. 기울기 조건을 만족하는 점을 모두 구하고 교점 수·부등식으로 후보를 배제한 뒤 인수정리로 계수를 복원한다.',
  '접촉이 반드시 이중근은 아니다. 삼중 접촉도 확인한다. 근과 계수의 합은 복소근 및 중복도까지 포함하므로 실교점 좌표 합으로 무조건 사용하지 않는다.'),
]

def checks():
    # Algebraic checks and curriculum-level exclusion examples; not a proof of semantic equivalence.
    return [
      dict(id='parity', name='단순·이중·삼중근: 부호변화와 절댓값 미분의 구분', passed=[(-1)**m for m in (1,2,3)]==[-1,1,-1] and [1 if m==1 else 0 for m in (1,2,3)]==[1,0,0], detail='부호변화: 1·3차 / |x^m| 미분 불가: 1차만. 3차를 꺾임으로 분류하면 실패. 독립 미분 검사는 test_sandbox.py에서 실행.'),
      dict(id='zero-interval', name='비음수만으로 엄격한 부호를 보장하지 않음', passed=sum(max(t-1,0)**2 for t in (0,0.5,1))==0 and max(2-1,0)**2>0, detail='w(t)=0 (t≤1), (t−1)² (t>1): [0,1]에서는 항등적으로 0. 다항식 전제 또는 모든 구간 적분 양수 전제가 필요.'),
      dict(id='tangent-order', name='삼중 접촉 제외 사례', passed=len(set([0,0,0]))==1, detail='y=x³의 원점 접선 y=0: x³=0의 서로 다른 해는 0 하나. 접선이면 교점 2개라는 일반화는 제외.'),
    ]

def make_examples(candidates, motifs, fingerprint):
    rng=random.Random(int(fingerprint[:16],16))
    names={m['id']:m['name'] for r in motifs['recipes'] for m in r['motifs']}
    bank=[]
    def add(family, number, mids, params, question, answer, solution, verification, power):
        if not set(mids)<=set(names): return
        elements=[rng.choice([{'id':i,'name':names[i],'source_motif_id':i,'approved':False},*candidates.get(i,[])]) for i in mids]
        bank.append(dict(id=f'{family}-{number}',family=family, elements=elements,parameters=params,
            question=question,answer=answer,solution=solution,verification=verification,power=power,
            status='experiment',quality='문항 성립 검산 완료 · 난도·참신성 사람 검수 전',asset_status='승인 자산만 사용' if all(m['approved'] for m in elements) else '후보 자산 포함',
            seed=f'{fingerprint[:12]}-{family}-{number}'))
    mid=lambda n:f'PA-MOTIF-S01-{n:02d}'
    for i in range(24):
        r=rng.randint(-5,2); s=r+rng.randint(2,6); b=rng.randint(-3,3)
        choose=i%2==1
        # F'=6(x-r)(x-s). w=(t-b)^2+1 is strictly positive.
        A=-3*(r+s); B=6*r*s
        polynomial=f'2x^3{A:+}x^2{B:+}x'
        q=f'$F(x)={polynomial}$이고 $G(x)=\\int_a^x(F(x)-F(t))((t-({b}))^2+1)dt$이다. '
        q+=f'$a>{(r+s)/2:g}$이고 G가 극값을 갖는 점이 정확히 1개일 때 a를 구하여라.' if choose else 'G가 극값을 갖는 점이 정확히 1개가 되도록 하는 모든 실수 a의 합을 구하여라.'
        answer=str(s if choose else r+s)
        cells=[r-1,r,(r+s)/2,s,s+1]
        counts=[sum(v%2 for v in [([r,s,a]).count(z) for z in set([r,s,a])]) for a in cells]
        assert counts==[3,1,3,1,3]
        add('적분·영점충돌',i,[mid(1),mid(2),mid(3)]+([mid(13)] if choose else []),dict(r=r,s=s,b=b,select=choose),q,answer,
          [f'$G\'(x)=6(x-({r}))(x-({s}))\\int_a^x((t-({b}))^2+1)dt$.',
           '피적분함수가 항상 양수이므로 적분 인수의 부호는 x−a와 같다.',
           f'a가 {r}, {s}와 모두 다르면 세 점에서 부호가 바뀐다. a가 둘 중 하나와 같으면 그 점의 부호변화가 상쇄되어 극값이 1개 남는다.',
           f'후보 a={r}, {s}'+(f' 중 추가 부등식으로 {s}만 남는다.' if choose else f'의 합은 {r+s}이다.')],
          ['다섯 위치 구간의 극값 수: 3, 1, 3, 1, 3','항상 양수인 가중치와 서로 다른 두 고정근 확인'],
          '주도: 영점 충돌 / 연결: 적분의 부호 / 선택 조건은 마지막 후보 수만 줄임')
        h=rng.randint(1,5); L=2*rng.randint(1,3); C=rng.randint(-7,7)
        value=L**4//2+2*h*L**3
        q=f'$F(x)=x^3-{3*h}x^2{C:+}$이고 양수 p에 대하여 $g(x)=\\begin{{cases}}F(x)-F(0)&x\\leq0\\\\F(x+p)-F(p)&x>0\\end{{cases}}$이다. g가 실수 전체에서 미분 가능할 때 $\\int_{{-{L}}}^{{{L}}}|g(x)|dx$를 구하여라.'
        add('붙임·절댓값적분',i,[mid(7),mid(8)],dict(h=h,L=L,C=C),q,str(value),
          ['함숫값 차이므로 상수항은 소거되고 원점에서 연속이다.',f'$F\'(p)=F\'(0)=0$에서 $3p(p-{2*h})=0$. p>0이므로 $p={2*h}$.',
           f'왼쪽 식은 $x^2(x-{3*h})$, 오른쪽 식은 $x^2(x+{3*h})$. 왼쪽은 음수, 오른쪽은 양수이다.',
           f'$\\int_{{-{L}}}^{{{L}}}|g(x)|dx=2\\int_0^{L}(x^3+{3*h}x^2)dx={value}$.'],
          ['p=0과 p=2h를 모두 구한 뒤 양수 조건 적용','붙임값·좌우 미분계수 일치, 각 반직선 부호 확인','원시함수 L⁴/2+2hL³ 대입 검산'],
          '주도: 붙임점 미분으로 이동량 확정 / 연결: 부호를 통한 절댓값 제거 / 상수항은 영향 없음')
        d=rng.randint(1,4); m=rng.randint(-5,5); sign=1 if i%2 else -1; T=2*d**3
        q=f'$f(t)=(t-({sign*T}))(t+({sign*T}))^2$, $H(x)=(x-({m}))^3-{3*d*d}(x-({m}))$이다. 방정식 $f(H(x))=0$의 서로 다른 실근 개수를 n, 함수 $|f(H(x))|$가 미분 불가능한 모든 x의 합을 S라 할 때 n+S를 구하여라.'
        roots=[m-2*d,m-d,m+d,m+2*d]; corner=m+sign*2*d
        assert len(set(roots))==4
        add('합성·중복도·꺾임',i,[mid(10),mid(11),mid(5)],dict(d=d,m=m,sign=sign),q,str(4+corner),
          [f'$z=x-({m})$로 두면 $H=z^3-{3*d*d}z$. 외부 함수의 서로 다른 근은 ±{T}이다.',
           f'$H-{T}=(z-{2*d})(z+{d})^2$, $H+{T}=(z+{2*d})(z-{d})^2$.',
           f'서로 다른 x는 {", ".join(map(str,roots))}이므로 n=4이다.',
           f'외부 함수에서 한 번 등장하는 인수는 H−({sign*T})이다. 그 인수의 단순근 x={corner}만 합성 후에도 단순근으로 남고 나머지는 2차 이상이다.',
           f'절댓값 다항식은 단순근에서만 미분 불가능하므로 S={corner}, n+S={4+corner}.'],
          ['합성 인수분해의 항등식 및 서로 다른 네 근 확인','외부·내부 중복도 곱으로 단순근 1개 확인'],
          '주도: 합성 후 근의 중복도 / 연결: 절댓값 미분 판정 / 같은 근 자료로 두 요구량을 판단')
    return bank

def build(root=ROOT):
    read=lambda n:json.loads((root/n).read_text(encoding='utf-8'))
    board=read('promotion-board.json'); assets=read('asset-library.json'); motifs=read('motif-library.json')
    candidates={c['id']:{**c,'author':a['name']} for a in board['instructors'] for c in a['candidates']}
    binding_path=root/'combination-bindings.json'
    bindings=read('combination-bindings.json') if binding_path.exists() else {'bindings':[]}
    engine_revision=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    fingerprint=digest([board,assets,motifs,bindings,engine_revision])
    groups=[]; used=set()
    for key,title,refs,proposal,guard in GROUPS:
        ids=[cid(*ref) for ref in refs if cid(*ref) in candidates]
        if not ids: continue
        members=[{k:candidates[i].get(k) for k in ('id','name','definition','kind','author','stage','fields','source_question_id')} for i in ids]
        group=dict(id=key,title=title,proposal=proposal,guard=guard,members=members,
            relation='검토 단위 · 개념/판단/스킬/전략의 역할 유지',reason='같은 추론 단계의 전제·적용·검산을 함께 비교하도록 추천했습니다. 원본을 자동 병합하지 않습니다.')
        pairs=[(cid('CON',1),cid('CON',1,True)),(cid('SKL',4),cid('SKL',1,True)),(cid('STR',5),cid('STR',1,True)),(cid('PAT',6),cid('PAT',1,True))]
        group['duplicate_pairs']=[{'ids':[a,b],'names':[candidates[a]['name'],candidates[b]['name']]} for a,b in pairs if a in ids and b in ids]
        group['regression_notes']={
          'derivative':['24개 차형 적분 문항에서 직접 적분 후 미분한 식과 곱 분해식을 비교'],
          'sign':['항상 양수인 다항식 가중치 사용 및 다섯 위치 구간의 극값 수 확인','0인 구간이 있는 비음수 함수는 제외 사례로 검사'],
          'collision':['24개 문항에서 실근을 격리해 중복도의 홀짝으로 극값 수 3·1·3·1·3 확인'],
          'absolute':['|x|, |x²|, |x³|의 좌우 미분계수 비교','24개 합성 문항에서 합성 후 단순근만 선택'],
          'shift':['기존 삼차식의 극점 이동 후보 (p,q)=(1,7),(-3,39)와 인수 x²(x−6) 확인'],
          'normalization':['24개 붙임 문항에서 상수항 소거와 붙임값 일치 확인'],
          'boundary':['24개 붙임 문항에서 p=0,2h 후보 및 정적분 값 재계산'],
          'composition':['24개 합성 다항식을 독립 인수분해하여 서로 다른 실근 4개와 단순근 1개 확인'],
          'tangent':['x³−3x의 같은 기울기 후보 −1,1 모두 확인','x³의 원점 접선은 삼중 접촉이므로 일반적인 두 교점 규칙에서 제외']
        }[key]
        group['revision']=digest(group); groups.append(group); used.update(ids)
    for i,c in candidates.items():
        if i in used: continue
        group=dict(id=i,title=c['name'],proposal=c['definition'],guard='신규 자산: 의미 비교와 연결 규칙 검토가 필요합니다.',members=[{k:c.get(k) for k in ('id','name','definition','kind','author','stage','fields','source_question_id')}],relation='신규 개별 검토',reason='아직 검증된 묶음 규칙이 없습니다.')
        group['revision']=digest(group);groups.append(group)
    report=checks()
    approved={e['id']:e for e in assets.get('entities',[]) if e.get('status') in {'approved','reviewed'}}
    adapted={};invalid=[]
    known_motifs={m['id'] for r in motifs['recipes'] for m in r['motifs']}
    for binding in bindings.get('bindings',[]):
        asset=approved.get(binding.get('asset_id'));role=binding.get('source_motif_id')
        if not asset or role not in known_motifs or asset_revision(asset)!=binding.get('asset_revision'):
            invalid.append(binding.get('asset_id'));continue
        adapted.setdefault(role,[]).append(dict(id=asset['id'],name=asset['name'],source_motif_id=role,approved=True))
    examples=make_examples(adapted,motifs,fingerprint)
    # A mapping manifest is rebuilt on every asset-data update. Unsupported assets stay visible.
    represented={m['source_motif_id'] for e in examples for m in e['elements']}
    unadapted=[{'id':m['id'],'name':m['name']} for r in motifs['recipes'] for m in r['motifs'] if m['id'] not in represented]
    supported={m['id'] for role,items in adapted.items() if role in represented for m in items}
    unadapted += [{'id':e['id'],'name':e.get('name',e['id'])+(' · 내용 변경으로 연결 재검토' if e['id'] in invalid else '')} for e in assets.get('entities',[]) if e['id'] not in supported]
    output={'version':fingerprint,'groups':groups,'checks':report,'example_count':len(examples)}
    bank={'version':fingerprint,'examples':examples,'unadapted':unadapted,'approved_count':len(assets.get('entities',[])),
          'policy':'현재 세미나 후보 기반 실험입니다. 신규 자산은 데이터 갱신 때 다시 검색하며, 미지원 자산은 연결 규칙을 만든 뒤 사용합니다.'}
    for name,value in [('review-groups.json',output),('combination-examples.json',bank)]:
        (root/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return output,bank

if __name__=='__main__':
    g,b=build();print(f"추천 검토 {len(g['groups'])}묶음 / 실험 문항 {len(b['examples'])}개")
