"""Apply the user's requested split; keep the original ID for the ratio skill.
Raw seminar evidence stays unchanged. Running twice does not duplicate assets.
"""
import copy
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
OLD='PA-CAND-SKL-20260910-033'
NEW='PA-CAND-SKL-20260914-001'
DEFINITIONS=[
    dict(candidate_id=OLD,name='절댓값 비율 |u|/u를 부호함수로 바꾸기',
         definition='u>0이면 |u|/u=1, u<0이면 |u|/u=−1이다. u=0에서는 원래 식이 정의되지 않으므로 정의역에서 제외하고, 별도로 함숫값이 주어진 경우 그 정의를 따른다.',
         fields=dict(input='|u(x)|/u(x), 단 u(x)≠0',action='u(x)의 양수·음수 구간을 구해 각각 1과 −1로 치환한다.',output='u의 크기는 사라지고 부호만 남는 구간별 상수함수',action_type='representation_change',error_conditions=['u(x)=0에 임의로 0을 대입하지 않는다.','u(x)=0이라는 사실만으로 좌우 부호가 바뀐다고 판단하지 않는다.'])),
    dict(candidate_id=NEW,name='절댓값 합·차 |u|±u를 구간별 식으로 바꾸기',
         definition='|u|+u는 u≥0에서 2u, u<0에서 0이다. |u|−u는 u≥0에서 0, u<0에서 −2u이다. 두 식 모두 u=0에서 0이며, u가 실수로 정의되는 모든 곳에서 사용할 수 있다.',
         fields=dict(input='|u(x)|+u(x) 또는 |u(x)|−u(x)',action='u(x)의 부호로 구간을 나누어 한쪽 구간은 0, 다른 쪽은 2u(x) 또는 −2u(x)로 쓴다.',output='부호에 따라 한쪽 부분만 남긴 구간별 함수; 각각 2max(u,0), 2max(−u,0)',action_type='representation_change',error_conditions=['u<0에서 |u|−u=−2u이다. 2u로 쓰면 부호 오류다.','u(x)=0은 정의역에서 제외하지 않는다.','u 자체의 정의역 제한은 그대로 유지한다.'])),
]

def run(root=ROOT):
    path=root/'archive/candidates/KICE-2021-06-Q14/PA-A-KICE-2021-06-Q14-M000002-S00.extraction.json'
    data=json.loads(path.read_text(encoding='utf-8'));rows=data['candidates']
    original=next(c for c in rows if c['candidate_id']==OLD)
    if original.get('split_children')==[OLD,NEW] and any(c['candidate_id']==NEW for c in rows):return
    if any(c['candidate_id']==NEW for c in rows):raise ValueError('새 ID가 이미 사용 중입니다')
    timestamp=datetime.now(timezone.utc).isoformat();before=copy.deepcopy(original)
    for spec in DEFINITIONS:
        row=original if spec['candidate_id']==OLD else copy.deepcopy(before)
        row.update(spec);row['status']='ai_candidate';row['split_from']=OLD
        row.pop('merge_proposal',None)
        row['decision_log']=[*row.get('decision_log',[]),dict(action='split',at=timestamp,basis='사용자가 해당 항목의 분리 자산화를 요청함',split_ids=[OLD,NEW])]
        if spec['candidate_id']==OLD:
            row['split_children']=[OLD,NEW];row.setdefault('revision_history',[]).append(dict(name=before['name'],definition=before['definition'],fields=before['fields'],replaced_at=timestamp,reason='비율 변환과 합·차 변환의 정의역·출력이 달라 분리'))
        else:
            row['epistemic']='derived'
            for key in ('instructor_reviews','review_status','ratified_atom_id','reviewed_by','reviewed_at'):row.pop(key,None)
            rows.append(row)
    board_path=root/'shared/review-board.json';board=json.loads(board_path.read_text(encoding='utf-8'))
    old_public=next(c for c in board['entities'] if c['id']==OLD)
    new_public=copy.deepcopy(old_public)
    for spec,public in zip(DEFINITIONS,[old_public,new_public]):
        public.update(id=spec['candidate_id'],name=spec['name'],definition=spec['definition'],status='ai_candidate',updatedAt='2026-09-14',splitFrom=OLD)
    board['entities'].append(new_public)
    for p,value in [(path,data),(board_path,board)]:p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    note=root/'archive/reviews/absolute-skill-split-20260914.json'
    note.write_text(json.dumps(dict(source_id=OLD,split_ids=[OLD,NEW],reason='부호만 남는 비율 변환과 크기가 남는 합·차 변환을 구분',original=before,after=DEFINITIONS,at=timestamp),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':run()
