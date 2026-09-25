"""Capture a sanitized, dated research snapshot. Never edits the live registry.

Usage: python build_seminar_report.py --source-dashboard PATH
Then: python build_seminar_report.py --render (offline, reproducible)
"""
from pathlib import Path
from collections import Counter
import argparse, hashlib, html, json, re, subprocess

ROOT = Path(__file__).resolve().parent
NAME = 'seminar-structure-report'
DATE = '2026-09-25'
TOPICS = {
    'integral': '정적분으로 정의된 함수',
    'count': '개수함수와 교점',
    'absolute': '절댓값이 포함된 식',
    'piecewise': '구간별 함수',
    'function': '지나는 점들로 함수 작성',
    'answer': '값의 범위와 정수',
    'motion': '거리와 이동',
}
# Explicit editorial mapping. Missing IDs fail; no guess based on a title.
GROUPS = {
 'integral': ['PA-MOTIF-S01-01','PA-MOTIF-S01-02','PA-MOTIF-S01-03','PA-S02-RECURRENCE-02','PA-S02-SIGNED-01','PA-S03-AREA-01','PA-S03-AREA-02','PA-S03-AREA-03','PA-S03-AREA-04','PA-GRAMMAR-11'],
 'count': ['PA-MOTIF-S01-10','PA-MOTIF-S01-11','PA-S02-LEVELS-02','PA-S02-WINDOW-01','PA-S02-WINDOW-02','PA-OP-FIXED-LEVELS','PA-BRIDGE-01','PA-S03-V-02','PA-GRAMMAR-01','PA-GRAMMAR-08','PA-GRAMMAR-12'],
 'absolute': ['PA-MOTIF-S01-05','PA-S02-LEVELS-01','PA-S02-JUMP-01','PA-CAND-SKL-20260910-033','PA-CAND-SKL-20260914-001','PA-S03-V-01','PA-GRAMMAR-03','PA-GRAMMAR-05'],
 'piecewise': ['PA-MOTIF-S01-04','PA-MOTIF-S01-08','PA-S02-JUMP-02','PA-S02-RECURRENCE-01','PA-S02-RECURRENCE-03','PA-S02-SIGNED-02','PA-S02-SIGNED-03','PA-S03-GRAPH-01','PA-S03-LIMIT-01','PA-S03-LIMIT-02','PA-S03-LIMIT-03','PA-S03-MIN-01','PA-GRAMMAR-02'],
 'function': ['PA-MOTIF-S01-06','PA-MOTIF-S01-07','PA-MOTIF-S01-12','PA-MOTIF-S01-13','PA-S02-JUMP-03','PA-S02-WINDOW-03','PA-S02-WINDOW-04','PA-BRIDGE-02','PA-BRIDGE-04','PA-BRIDGE-06','PA-BRIDGE-08','PA-GRAMMAR-04','PA-GRAMMAR-06','PA-GRAMMAR-07','PA-GRAMMAR-13','PA-GRAMMAR-14','PA-GRAMMAR-15'],
 'answer': ['PA-MOTIF-S01-09','PA-S02-LEVELS-03','PA-S02-JUMP-04','PA-BRIDGE-03','PA-BRIDGE-05','PA-BRIDGE-09','PA-GRAMMAR-09','PA-GRAMMAR-10'],
 'motion': ['PA-S02-TRAVEL-01','PA-S02-TRAVEL-02','PA-S02-TRAVEL-03','PA-S02-TRAVEL-04','PA-S02-TRAVEL-05','PA-BRIDGE-07'],
}
ALIASES = {
 'PA-MOTIF-S01-01':'정적분으로 정의된 함수',
 'PA-MOTIF-S01-02':'정적분의 부호', 'PA-MOTIF-S01-03':'극값 개수와 근의 겹침',
 'PA-MOTIF-S01-05':'절댓값과 미분가능성', 'PA-MOTIF-S01-07':'같은 높이의 두 점',
 'PA-MOTIF-S01-10':'합성방정식과 직선', 'PA-S02-LEVELS-02':'개수함수',
 'PA-S02-JUMP-04':'여러 식의 근과 중복', 'PA-GRAMMAR-09':'곱으로 된 방정식의 근',
 'PA-S03-AREA-02':'정적분과 넓이가 같을 때', 'PA-S03-GRAPH-01':'구간별 함수의 그래프',
 'PA-BRIDGE-04':'도함수와 한 점으로 함수 작성', 'PA-S02-WINDOW-03':'지나는 점들로 함수 작성',
}
BUNDLE_CANDIDATES = [
 ('integral-sign-extrema','정적분의 부호와 극값',[1],['PA-MOTIF-S01-01','PA-MOTIF-S01-02','PA-MOTIF-S01-03'],'적분 안 함수의 부호 변화와 인수의 0이 겹치는 경우를 별도로 검사'),
 ('count-contact-heights','개수함수와 접하는 높이',[2,7,14,16,19],['PA-S02-LEVELS-02','PA-OP-FIXED-LEVELS'],'목표 높이를 생성하는 적분·합성과 접점 개수를 잇는 관계 추가'),
 ('zeros-of-integrals','정적분이 0인 곳',[3,6,15],['PA-S03-GRAPH-01','PA-GRAMMAR-06'],'전 구간 부호, 내부의 접하는 근, 조각의 공통 계수를 구분'),
 ('continuous-product','끊기는 함수와 이어지는 곱',[4,10],['PA-S02-JUMP-02','PA-S02-JUMP-03'],'유한 점프와 발산을 구별하고 필요한 0의 반복 횟수 확인'),
 ('moving-integral','움직이는 정적분 구간',[5,11],['PA-S03-GRAPH-01','PA-S03-LIMIT-02'],'이동하는 두 끝점이 조각 경계를 지나는 위치와 좌우 증감 추가'),
 ('signed-area','정적분과 넓이',[8,13],['PA-S03-AREA-01','PA-S03-AREA-02','PA-S03-AREA-03'],'적분의 절댓값과 절댓값의 적분은 기존 계약과 같지 않음'),
 ('reflected-roots','반사한 그래프와 근',[9,13],['PA-S02-JUMP-04','PA-GRAMMAR-10'],'원래 사용하는 구간과 반사된 근의 대응 및 경계 중복을 기록'),
 ('extrema-heights-positions','극값의 높이와 위치',[17,20],['PA-BRIDGE-02'],'높이 차와 위치 간격을 다른 결과로 저장, 도함수의 0을 극값으로 자동 인정하지 않음'),
 ('shared-junction','조각 사이의 값과 기울기',[12,18],['PA-S02-RECURRENCE-01','PA-S02-SIGNED-02'],'무한히 많은 근을 만드는 평평한 조각과 유한 근 배치를 분리'),
]

def load(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(p,d): Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def capture(source):
    source=source.resolve(); project=source.parent
    reg=load(source/'connection-registry.json'); deployed=load(ROOT/'connection-registry.json')
    lookup={v:k for k,values in GROUPS.items() for v in values}
    assert len(lookup)==sum(map(len,GROUPS.values()))
    assert set(lookup)=={o['id'] for o in reg['operations']}, 'Review mappings after a registry revision.'
    records=[{k:r[k] for k in ('id','name','kind','origin','source_status','integration_status','connection_ids')} for r in reg['records']]
    operations=[]
    for o in reg['operations']:
        operations.append({k:o[k] for k in ('id','name','kind','requires','provides','forbids','guard_note','supports','review_status','curriculum','work','influence')} | {
            'display_name':ALIASES.get(o['id'],o['name']), 'proposed_topic':lookup[o['id']],
            'exposure':o.get('exposure','visible'), 'classification_status':'ai_proposal',
            'available_in_deployed_engine_at_audit':o['id'] in {x['id'] for x in deployed['operations']},
        })
    kinds=Counter(r['kind'] for r in records)
    paths=['connection-registry.json','asset-library.json','review-catalog.json','source-witnesses.json','judgment-bundles.js','authoring-lessons.json','connection-validation.json']
    sources=[{'file':p,'sha256':sha(source/p)} for p in paths]
    batches=[]
    for a,b,name,verifier in [(1,5,'cubic-piecewise-integral-20260925.json','verify_cubic_batch.py'),(6,10,'cubic-piecewise-integral-20260925-batch02.json','verify_cubic_batch_02.py'),(11,20,'inference-batch03.json','verify_batch_03.py')]:
        data=load(source/'production'/name)
        fields=('id','question','solution','answer') if a==11 else ('id','question','solution','answer','params')
        digest=hashlib.sha256(json.dumps([{k:i[k] for k in fields} for i in data['items']],ensure_ascii=False,sort_keys=True).encode()).hexdigest()
        expected={1:'3156cb236eb5126ee700d4b4114478287b8d6d2186e0772631cb8079f50dd3a8',6:'4c1be479c8918a76a5e633624db35ac2ec14db24f6596eebee588690e61bd57f',11:'e8123ddd5adeb2a02e1825fd4e3523deab7fe5cc55e1620dc4f08dcce4fc3db6'}[a]
        assert digest==expected
        batches.append({'range':[a,b],'count':len(data['items']),'document_sha256':digest,'verifier':verifier,'verifier_sha256':sha(source/'production'/verifier),'rerun_on':DATE,'symbolic_regression_passed':True,'human_approved':False,'difficulty_calibrated':False})
    bundle_count=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./judgment-bundles.js').catalog.length))"],cwd=source))
    data={'schema':'problem-atom/seminar-structure-report/1','date':DATE,'classification_status':'ai_proposal','registry_mutated':False,
      'scope':'현재 통합 작업본의 고정 스냅샷', 'registry_revision':reg['revision'],'topics':TOPICS,
      'summary':{'records':len(records),'analysis_entries':sum(kinds[k] for k in ('concept','skill','decision','strategy','problem_pattern')),'operations':len(operations),'bridges':sum(o['kind']=='bridge' for o in operations),'hidden_grammar':sum(o['exposure']=='grammar' for o in operations),'linked_records':sum(r['integration_status']=='contract_linked' for r in records),'reference_records':sum(r['integration_status']=='reference_only' for r in records),'review_groups':len(load(source/'review-catalog.json')['groups']),'bundles':bundle_count,'source_replays':len(load(source/'source-witnesses.json')['witnesses']),'file_approved_assets':len(load(source/'asset-library.json')['entities'])},
      'deployed_at_audit':{'url':'https://jaewong1994.github.io/problem-atom-dashboard/','records':len(deployed['records']),'operations':len(deployed['operations']),'registry_revision':deployed['revision'],'checked_on':DATE},
      'kind_counts':dict(kinds),'origin_counts':dict(Counter(r['origin'] for r in records)),
      'role_counts':dict(Counter(o['influence']['role'] for o in operations)),
      'curriculum_counts':dict(Counter(x for o in operations for x in o['curriculum'])),
      'records':records,'operations':operations,'source_files':sources,'authored_batches':batches,
      'limits':[]}
    data['limits']=['파일 원장 기준이며 Supabase·브라우저의 개인별 승인 이력은 합산하지 않음','20문항은 현재 대화에서 직접 설계·검산했으며 자동 생성 엔진의 성능 시험이 아님','파일별 분류안은 기존 승인 상태와 연결 계약을 변경하지 않음']
    data['bundle_candidates']=[{'id':'REPORT-20260925-'+key,'name':name,'evidence_item_numbers':numbers,'related_operations':related,'requires_new_review':gap,'status':'ai_proposal','executable':False} for key,name,numbers,related,gap in BUNDLE_CANDIDATES]
    data['proposed_item_role_fields']=['core_judgment','bridge','calculation','answer_assembly','validation']
    data['proposal_note']='원자 자체의 고정 점수가 아닌 문항별 역할. 기존 연결 계약·승인 상태를 자동 변경하지 않는다.'
    dump(ROOT/(NAME+'.json'),data)

def inline(s):
    s=html.escape(s)
    return re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)

def markdown_html(text):
    """Small explicit subset used by the report; no raw HTML or arbitrary URLs."""
    out=[];lines=text.splitlines();i=0;h=0
    while i<len(lines):
        line=lines[i]
        if not line.strip(): i+=1;continue
        if line.startswith('# '): i+=1;continue
        if line.startswith('## '):
            h+=1;out.append(f'<h2 id="section-{h}">{inline(line[3:])}</h2>');i+=1;continue
        if line.startswith('### '):out.append('<h3>'+inline(line[4:])+'</h3>');i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                cells=[c.strip() for c in lines[i].strip('|').split('|')]
                if not all(re.fullmatch(r'[- :]+',c) for c in cells):rows.append(cells)
                i+=1
            out.append('<div class="table-scroll" tabindex="0" role="region" aria-label="분류 비교표"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows[1:])+'</tbody></table></div>');continue
        if line.startswith('- '):
            out.append('<ul>')
            while i<len(lines) and lines[i].startswith('- '):out.append('<li>'+inline(lines[i][2:])+'</li>');i+=1
            out.append('</ul>');continue
        out.append('<p>'+inline(line)+'</p>');i+=1
    return '\n'.join(out)

def render():
    d=load(ROOT/(NAME+'.json'));s=d['summary']
    text=(ROOT/(NAME+'.md')).read_text(encoding='utf8')
    toc=''.join(f'<a href="#section-{n}">{inline(t)}</a>' for n,t in enumerate(re.findall(r'^## (.+)$',text,re.M),1))
    from build_navigation import header
    inventories=[]
    for o in d['operations']:
        keywords=' '.join([o['id'],o['name'],o['display_name'],d['topics'][o['proposed_topic']]])
        notes='내부 연결에 사용' if o['exposure']=='grammar' else '선택 재료 또는 연결 단계'
        inventories.append('<details class="inventory-item" data-topic="'+o['proposed_topic']+'" data-search="'+html.escape(keywords.lower(),quote=True)+'"><summary><span><small>'+d['topics'][o['proposed_topic']]+'</small><strong>'+inline(o['display_name'])+'</strong></span><span class="expand" aria-hidden="true">+</span></summary><div class="inventory-body"><p>'+inline(o['guard_note'])+'</p><dl><dt>기존 이름</dt><dd>'+inline(o['name'])+'</dd><dt>기존 분류</dt><dd>'+('가교' if o['kind']=='bridge' else '풀이 단계')+' · '+notes+'</dd><dt>필요한 정보 → 얻는 정보</dt><dd>'+str(len(o['requires']))+'가지 → '+str(len(o['provides']))+'가지</dd><dt>식별자</dt><dd class="mono">'+o['id']+'</dd></dl><p class="subtle">분류 제안 · 사람 검수 대기. 이 카드는 문항을 생성하거나 자산을 승인하지 않습니다.</p></div></details>')
    options=''.join('<option value="'+k+'">'+v+'</option>' for k,v in d['topics'].items())
    page='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>세미나 원자 구성·분류 리포트 · Problem Atom</title><meta name="description" content="20문항 제작에서 얻은 교훈으로 점검한 세미나 자산 현황과 분류 개선안"><link rel="stylesheet" href="site-shell.css?v=flow3"><link rel="stylesheet" href="seminar-structure-report.css?v=1"><script defer src="seminar-structure-report.js?v=1"></script></head><body>'''+'<!--SITE_NAV-->\n'+header('seminar-structure-report')+'\n<!--/SITE_NAV-->'+ '''
<main id="main"><header class="report-hero"><p class="eyebrow">SEMINAR RESEARCH NOTE · 2026.09.25</p><h1>원자를 모으는 단계에서,<br>판단을 연결하는 구조로.</h1><p class="lead">20문항을 직접 만들며 점검한<br class="mobile-break"> 세미나 원자 구성과 분류 개선안</p><div class="hero-actions"><a href="#section-1">핵심 진단 읽기 ↓</a><a href="#inventory">73개 연결 단계 찾아보기</a><a href="seminar-structure-report.md" download>리포트 저장</a></div></header>
<div class="report-stats" aria-label="통합 작업본의 파일 집계">'''+''.join('<div><strong>'+str(n)+'</strong><span>'+label+'</span></div>' for n,label in [(s['records'],'통합 기록'),(s['operations'],'연결 단계'),(s['bridges'],'가교 · 단계에 포함'),(20,'제작·검산 문항')])+'''</div>
<p class="scope-note">집계 기준: 2026-09-25 통합 작업본. 공개 제작실의 기존 자산 수와는 다릅니다. <a href="#section-2">차이 확인</a></p>
<div class="report-layout"><aside><nav class="report-toc" aria-label="리포트 목차">'''+toc+'''<a href="#inventory">부록 · 전체 분류 찾아보기</a></nav></aside><article>'''+markdown_html(text)+'''
<section id="inventory"><p class="eyebrow">CLASSIFICATION INDEX</p><h2>전체 연결 단계 · 분류 제안</h2><p>기존 ID와 계약은 그대로 두고, 찾기 쉬운 주제별로 정리했습니다. 펼치면 기존 이름과 적용 범위를 볼 수 있습니다. 각 단계의 대표 진입 주제 하나를 표시한 것으로, 다른 주제에서의 사용을 금지하는 분류는 아닙니다.</p><div class="filters" hidden><label>이름 또는 식별자<input id="report-search" type="search" placeholder="예: 개수함수, 절댓값"></label><label>주제<select id="report-topic"><option value="">모든 주제</option>'''+options+'''</select></label><button id="report-reset" type="button">필터 초기화</button></div><p id="report-count" role="status" aria-live="polite">73개 연결 단계</p><div class="inventory">'''+''.join(inventories)+'''</div><p id="report-empty" hidden>일치하는 연결 단계가 없습니다. 검색어나 주제를 바꿔 주세요.</p><a class="download-link" href="seminar-structure-report.json" download>집계·분류·근거 판본 JSON 저장</a></section>
</article></div><footer class="report-footer"><a href="index.html">홈으로</a><span>Problem Atom · 파일 원장 분석 / 분류 제안</span><a href="#main">맨 위로 ↑</a></footer></main></body></html>'''
    (ROOT/(NAME+'.html')).write_text(page,encoding='utf8')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source-dashboard',type=Path);p.add_argument('--render',action='store_true');a=p.parse_args()
    if a.source_dashboard:capture(a.source_dashboard)
    if a.render:render()
