"""Export reviewed session results to a standalone, private comparison document."""
import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build(manifest_path, destination):
    manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
    items = []
    for entry in manifest['items']:
        job = json.loads((ROOT/'.pa-session'/f"{entry['request_id']}.json").read_text(encoding='utf-8'))
        if job['status'] != 'completed' or not entry.get('independent_math_verified'):
            raise ValueError('완료된 실제 세션 결과를 독립 검산한 뒤 내보내세요.')
        if not job['output']['validation']['accepted'] and not entry.get('connection_note'):
            raise ValueError('연결 검사 미통과 사유를 독립 검산과 구분해 적어야 합니다.')
        result = job['output']['result']
        items.append({**entry, 'result': result, 'model': job['output']['model'],
                      'created_at': job['createdAt'], 'human_approved': False,
                      'connection_validation': job['output']['validation']})
    if len(items) != 5 or len({x['request_id'] for x in items}) != 5:
        raise ValueError('서로 다른 실제 제작 기록 다섯 개가 필요합니다.')
    destination = Path(destination).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    data = {**manifest, 'items': items}
    (destination/'제작기록.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    shutil.copytree(ROOT/'vendor/katex', destination/'katex', dirs_exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    html = TEMPLATE.replace('__DATA__', payload)
    (destination/'5문항_비교검토.html').write_text(html, encoding='utf-8')
    print(destination/'5문항_비교검토.html')


TEMPLATE = r'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>핵심 원자 고정 · 5문항 실험</title><link rel="stylesheet" href="katex/katex.min.css"><script defer src="katex/katex.min.js"></script>
<style>
:root{--ink:#172d4d;--blue:#315aa0;--muted:#627188;--line:#d6dfeb;--bg:#f4f7fb}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.9 'Malgun Gothic',system-ui,sans-serif}main{max-width:1040px;margin:auto;padding:44px 26px 80px}h1{font-size:32px;line-height:1.4;letter-spacing:-1px}h2{font-size:22px}h3{font-size:17px}p{margin:12px 0}.eyebrow{font-size:12px;font-weight:700;letter-spacing:1px;color:var(--blue)}.muted{color:var(--muted);font-size:14px}.core{border-left:4px solid var(--blue);background:#eaf0fb;padding:18px 24px;margin:24px 0}.core b{display:block}.toolbar{display:flex;gap:10px;flex-wrap:wrap;position:sticky;top:0;background:#f4f7fbef;padding:12px 0;z-index:2}.toolbar a,button{border:1px solid var(--line);border-radius:8px;padding:9px 14px;background:white;color:var(--ink);font:inherit;font-size:14px;cursor:pointer;min-height:44px;text-decoration:none}.toolbar a:hover,button:hover{border-color:var(--blue)}:focus-visible{outline:3px solid #547fc4;outline-offset:3px}.problem{background:white;border:1px solid var(--line);border-radius:14px;padding:30px 36px;margin:26px 0;scroll-margin-top:80px}.problem-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:22px}.problem-head h2{margin:0}.badge{font-size:13px;background:#edf3ff;color:var(--blue);padding:5px 12px;border-radius:7px}.question{font-family:'Batang','Malgun Gothic',serif;font-size:18px;line-height:2}.question p{margin:15px 0}.katex-display{overflow-x:auto;overflow-y:hidden;padding:7px 0}.katex{font-size:1.1em}details{border-top:1px solid var(--line);padding-top:8px;margin-top:26px}summary{cursor:pointer;font-weight:700;min-height:44px;padding:9px 0}.answer{color:var(--blue);font-weight:700}.explain p{font-size:15px}.assessment{background:#f7f9fc;padding:16px 20px;border-radius:8px;margin-top:16px}.assessment b{display:block}.assessment p{font-size:14px}.atom-list{display:flex;gap:8px;flex-wrap:wrap}.atom-list span{font-size:12px;background:#eaf0f7;padding:4px 10px;border-radius:5px}.review{padding:24px 0}.review-table{overflow:auto}table{width:100%;border-collapse:collapse;background:white;font-size:14px;min-width:620px}th,td{padding:14px;text-align:left;border:1px solid var(--line);vertical-align:top}th{background:#eaf0f7}code{overflow-wrap:anywhere;font-size:12px}footer{font-size:13px;color:var(--muted);margin-top:28px}@media(max-width:600px){main{padding:26px 16px 60px}h1{font-size:26px}.problem{padding:24px 20px}.problem-head{display:block}.badge{display:inline-block;margin-top:8px}.question{font-size:16px}.toolbar{gap:6px}.toolbar a,button{font-size:12px;padding:8px 10px}.core{padding:15px 18px}}@media print{body{background:white}main{max-width:none;padding:0}.toolbar,.review,header,footer,.assessment,.provenance{display:none}.problem{border:0;padding:0;margin:0;break-after:page}.problem:last-child{break-after:auto}.question{font-size:12pt}.problem-head{margin-top:0}.problem details:not([open]){display:none}.problem details[open]{break-before:page}}
</style></head><body><main><header><p class="eyebrow">PROBLEM ATOM / CONTROLLED COMPOSITION</p><h1>한 가지 핵심 조건, 다섯 가지 풀이 경로</h1><p>같은 조건을 중심에 두고, 정보를 찾는 방법과 추론 방향을 바꿔 본 제작 실험입니다.</p><div class="core"><b>고정한 핵심 조건</b><span>함수 Gₐ가 극값을 갖는 x의 개수는 정확히 1이다.</span></div><p class="muted">현재 엔진과 Codex Sol 세션에서 실제로 제작한 결과입니다. 난이도는 이 다섯 문항 안에서의 상대적인 예상이며, 학생 정답률로 보정한 등급이 아닙니다. 난도별 조건 구조와 출제 의도는 제작 요청에 구체적으로 지정했고 생성 후 별도로 검산했습니다.</p></header><nav class="toolbar" aria-label="문항 이동"><a href="#q1">01 기본</a><a href="#q2">02 식 해석</a><a href="#q3">03 복원</a><a href="#q4">04 역추론</a><a href="#q5">05 분기</a><button id="answers">해설 모두 펼치기</button><button id="print">인쇄 / PDF</button></nav><div id="items"></div><section class="review" id="findings"><h2>이 실험에서 확인한 점</h2><div id="conclusions"></div><div class="review-table"><table><thead><tr><th>문항</th><th>새로 필요한 생각</th><th>계산 부담</th><th>핵심 조건을 빼면</th></tr></thead><tbody id="comparison"></tbody></table></div></section><footer>원본 생성 결과와 실제 사용 원자 ID는 같은 폴더의 제작기록.json에 보관했습니다. 자동 공유 자산 등록이나 교사 승인은 수행하지 않았습니다.</footer></main><script type="application/json" id="data">__DATA__</script>
<script>document.addEventListener('DOMContentLoaded',()=>{const data=JSON.parse(document.getElementById('data').textContent),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};function math(text){const p=el('p'),re=/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;let pos=0;for(const m of text.matchAll(re)){p.append(document.createTextNode(text.slice(pos,m.index)));const s=el('span');katex.render(m[1]||m[2],s,{displayMode:Boolean(m[1]),throwOnError:false,trust:false});p.append(s);pos=m.index+m[0].length;}p.append(document.createTextNode(text.slice(pos)));return p;}
data.items.forEach((item,i)=>{const r=item.result,section=el('article',null,'problem');section.id='q'+(i+1);const head=el('div',null,'problem-head');head.append(el('h2','문항 '+(i+1)),el('span',item.level_label,'badge'));section.append(head);const q=el('div',null,'question');(item.display_question||r.question).forEach(t=>q.append(math(t)));section.append(q);const details=el('details',null,'solution');details.append(el('summary','정답과 풀이'));const answer=math('정답: '+r.answer);answer.className='answer';details.append(answer);const explanation=el('div',null,'explain');(item.display_solution||r.solution).forEach(t=>explanation.append(math(t)));details.append(explanation);const review=el('div',null,'assessment');review.append(el('b','검토 메모'));[item.difficulty_note,item.core_effect,item.independent_check,...(item.connection_note?[item.connection_note]:[])].forEach(t=>review.append(math(t)));details.append(review);section.append(details);const trace=el('details',null,'provenance');trace.append(el('summary','조합 재료와 실제 제작 기록'));const list=el('div',null,'atom-list');item.atom_names.forEach(t=>list.append(el('span',t)));trace.append(list,el('p',item.model+' · '+new Date(item.created_at).toLocaleString('ko-KR'),'muted'),el('code',item.request_id));section.append(trace);document.getElementById('items').append(section);const row=el('tr');[String(i+1),item.new_reasoning,item.calculation,item.removal_effect].forEach(t=>row.append(el('td',t)));document.getElementById('comparison').append(row);});data.conclusions.forEach(t=>document.getElementById('conclusions').append(math(t)));let open=false;document.getElementById('answers').onclick=()=>{open=!open;document.querySelectorAll('details.solution').forEach(d=>d.open=open);document.getElementById('answers').textContent=open?'해설 모두 접기':'해설 모두 펼치기';};document.getElementById('print').onclick=()=>window.print();});</script></body></html>'''


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest')
    parser.add_argument('destination')
    args = parser.parse_args()
    build(args.manifest, args.destination)
