"""Publish an explicit summary projection; private originals remain outside the site."""
import argparse
import json
from pathlib import Path

DASH=Path(__file__).resolve().parent


def build(source):
    motifs=json.loads((source/'motifs.json').read_text(encoding='utf-8'))['motifs']
    recipes=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((source/'recipes').glob('*.json'))]
    result={'version':'seminar-motifs-20260914-v1','status':'AI 재분석 · 사람 검수 대기','recipes':[]}
    for r in recipes:
        row={k:r[k] for k in ['id','author','name','source_question_id','discovery','correction','influence','evaluation_kind']}
        row['motifs']=[{k:m[k] for k in ['id','name','claim','preconditions','replaceable','failure_modes','legacy_atom_refs','source_pages']} for m in motifs if m['recipe_id']==r['id']]
        result['recipes'].append(row)
    result['transfers']=json.loads((source/'transfer-links.json').read_text(encoding='utf-8'))
    verification=json.loads((source/'verification.json').read_text(encoding='utf-8'))
    assert verification['passed'], '검산 실패 자산은 배포할 수 없습니다'
    result['verification']={'checks':verification['checks_passed'],'scope':'원형 재검산·출처·연결 검사. 새 조합 문항의 품질 승인이 아닙니다.'}
    text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    assert all(token not in text for token in ['C:\\','C:/','OneDrive','"question":','"proof":','"sha256":'])
    (DASH/'motif-library.json').write_text(text,encoding='utf-8')
    print(f'Published summaries: {len(recipes)} recipes / {len(motifs)} motifs')


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,default=DASH.parent/'archive/motifs/seminar-01')
    build(parser.parse_args().source)
